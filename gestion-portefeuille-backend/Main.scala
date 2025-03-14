import akka.actor.typed._
import akka.actor.typed.scaladsl._
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives._
import spray.json._
import scala.concurrent.{ExecutionContext, Future}
import akka.http.scaladsl.model.{HttpEntity, StatusCodes}
import java.sql.{Connection, DriverManager, PreparedStatement, ResultSet}
import pdi.jwt._
import sttp.client3._
import sttp.client3.HttpURLConnectionBackend
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.marshalling.ToResponseMarshallable
import akka.http.scaladsl.unmarshalling.Unmarshaller
import ch.megard.akka.http.cors.scaladsl.CorsDirectives._
import ch.megard.akka.http.cors.scaladsl.settings.CorsSettings


object DatabaseService {
  val url = "jdbc:mysql://localhost:3306/portefeuille"
  val user = "root"
  val password = "cytech0001"

  def getConnection: Connection = {
    DriverManager.getConnection(url, user, password)
  }
}

case class Portfolio(userId: String, symbol: String, quantity: Int)
case class AddAssetRequest(symbol: String, quantity: Int)
case class StockPrice(symbol: String, price: Double, timestamp: Long)
case class User(username: String, password: String)
case class LoginResponse(token: String)
case class MarketData(symbol: String, price: Double, change: Double)

trait JsonSupport extends DefaultJsonProtocol {
  implicit val portfolioFormat: RootJsonFormat[Portfolio] = jsonFormat3(Portfolio.apply)
  implicit val addAssetFormat: RootJsonFormat[AddAssetRequest] = jsonFormat2(AddAssetRequest.apply)
  implicit val stockPriceFormat: RootJsonFormat[StockPrice] = jsonFormat3(StockPrice.apply)
  implicit val userFormat: RootJsonFormat[User] = jsonFormat2(User.apply)
  implicit val loginResponseFormat: RootJsonFormat[LoginResponse] = jsonFormat1(LoginResponse.apply)
  implicit val marketDataFormat: RootJsonFormat[MarketData] = jsonFormat3(MarketData.apply)
  implicit val userUnmarshaller: Unmarshaller[HttpEntity, User] = sprayJsonUnmarshaller[User].forContentTypes(akka.http.scaladsl.model.ContentTypes.`application/json`)
}
object PortfolioRepository {
  def getPortfolio(userId: String): Future[List[Portfolio]] = Future {
    val conn = DatabaseService.getConnection
    val stmt = conn.prepareStatement("SELECT * FROM portfolios WHERE user_id = ?")
    stmt.setString(1, userId)
    val rs = stmt.executeQuery()
    val results = Iterator.continually((rs.next(), rs)).takeWhile(_._1).map { case (_, row) =>
      Portfolio(row.getString("user_id"), row.getString("symbol"), row.getInt("quantity"))
    }.toList
    rs.close()
    stmt.close()
    conn.close()
    results
  }(ExecutionContext.global)

  def addAsset(portfolio: Portfolio): Future[Int] = Future {
    val conn = DatabaseService.getConnection
    val stmt = conn.prepareStatement("INSERT INTO portfolios (user_id, symbol, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?")
    stmt.setString(1, portfolio.userId)
    stmt.setString(2, portfolio.symbol)
    stmt.setInt(3, portfolio.quantity)
    stmt.setInt(4, portfolio.quantity)
    val result = stmt.executeUpdate()
    stmt.close()
    conn.close()
    result
  }(ExecutionContext.global)

  def removeAsset(portfolio: Portfolio): Future[Int] = Future {
    val conn = DatabaseService.getConnection
    val stmt = conn.prepareStatement("DELETE FROM portfolios WHERE user_id = ? AND symbol = ?")
    stmt.setString(1, portfolio.userId)
    stmt.setString(2, portfolio.symbol)
    val result = stmt.executeUpdate()
    stmt.close()
    conn.close()
    result
  }(ExecutionContext.global)

}
object AuthRepository {
  def registerUser(username: String, password: String)(implicit ec: ExecutionContext): Future[Boolean] = Future {
    val conn: Connection = DatabaseService.getConnection
    val checkStmt = conn.prepareStatement("SELECT COUNT(*) FROM users WHERE username = ?")
    checkStmt.setString(1, username)
    val rs = checkStmt.executeQuery()
    rs.next()
    val exists = rs.getInt(1) > 0
    checkStmt.close()

    if (exists) {
      conn.close()
      false
    } else {
      val stmt = conn.prepareStatement("INSERT INTO users (username, password) VALUES (?, ?)")
      stmt.setString(1, username)
      stmt.setString(2, password)
      val result = stmt.executeUpdate() > 0
      stmt.close()
      conn.close()
      result
    }
  }

  def authenticateUser(username: String, password: String)(implicit ec: ExecutionContext): Future[Option[String]] = Future {
    val conn: Connection = DatabaseService.getConnection
    val stmt = conn.prepareStatement("SELECT password FROM users WHERE username = ?")
    stmt.setString(1, username)
    val rs = stmt.executeQuery()

    if (rs.next()) {
      val storedPassword = rs.getString("password")
      if (password == storedPassword) {
        val claim = JwtClaim(s"""{"username": "$username", "timestamp": ${System.currentTimeMillis()}}""")
        Some(Jwt.encode(claim, "secretKey", JwtAlgorithm.HS256))
      } else {
        None
      }
    } else {
      None
    }
  }

}

object MarketRepository {
  def getMarketData(): Future[List[MarketData]] = Future {
    List(
      MarketData("AAPL", 150.25, 1.5),
      MarketData("GOOGL", 2800.5, -0.8),
      MarketData("AMZN", 3400.75, 0.4)
    )
  }(ExecutionContext.global)
}

object PortfolioRoutes extends JsonSupport {
  implicit val ec: ExecutionContext = ExecutionContext.global

  def routes =
    pathPrefix("portfolio") {
      concat(
        path(Segment) { userId =>
          get {
            onSuccess(PortfolioRepository.getPortfolio(userId)) { result =>
              complete(ToResponseMarshallable(result.toJson))
            }
          }
        },
        path("add") {
          post {
            entity(as[Portfolio]) { portfolio =>
              onSuccess(PortfolioRepository.addAsset(portfolio)) { _ =>
                complete(StatusCodes.OK, "Asset added")
              }
            }
          }
        },
        path("remove") {
          post {
            entity(as[Portfolio]) { portfolio =>
              onSuccess(PortfolioRepository.removeAsset(portfolio)) { _ =>
                complete(StatusCodes.OK, "Asset removed")
              }
            }
          }
        }
      )
    }
}

object MarketRoutes extends JsonSupport {
  def routes =
    path("market-data") {
      get {
        onSuccess(MarketRepository.getMarketData()) { result =>
          complete(ToResponseMarshallable(result.toJson))
        }
      }
    }
}

object AuthRoutes extends JsonSupport {
  def routes(implicit ec: ExecutionContext): akka.http.scaladsl.server.Route =
    path("register") {
      post {
        entity(as[User]) { user =>
          onSuccess(AuthRepository.registerUser(user.username, user.password)) { result =>
            if (result) complete(StatusCodes.Created)
            else complete(StatusCodes.Conflict, "User already exists")
          }
        }
      }
    } ~
      path("login") {
        post {
          entity(as[User]) { user =>
            onSuccess(AuthRepository.authenticateUser(user.username, user.password)) {
              case Some(token) => complete(LoginResponse(token))
              case None => complete(StatusCodes.Unauthorized, "Invalid credentials")
            }
          }
        }
      }
}

object Main extends App {
  implicit val system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "PortfolioSystem")
  implicit val executionContext: ExecutionContext = system.executionContext

  val corsSettings = CorsSettings.defaultSettings.withAllowGenericHttpRequests(true)

  val routes = cors(corsSettings) {
    concat(AuthRoutes.routes, PortfolioRoutes.routes, MarketRoutes.routes)
  }

  Http().newServerAt("localhost", 9000).bind(routes)
  println("🚀 Serveur Portfolio démarré sur http://localhost:9000")
}