import akka.actor.typed._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import scala.concurrent.ExecutionContext
import spray.json.DefaultJsonProtocol._
import ch.megard.akka.http.cors.scaladsl.settings.CorsSettings
import ch.megard.akka.http.cors.scaladsl.model.HttpOriginMatcher
import akka.http.scaladsl.model.headers.HttpOrigin
import akka.http.scaladsl.model.HttpMethods
import ch.megard.akka.http.cors.scaladsl.model.HttpHeaderRange
import akka.actor.typed.scaladsl._
import ch.megard.akka.http.cors.scaladsl.model.HttpOriginMatcher
import akka.http.scaladsl.model.headers.HttpOrigin
import ch.megard.akka.http.cors.scaladsl.settings.CorsSettings
import ch.megard.akka.http.cors.scaladsl.CorsDirectives._
import akka.http.scaladsl.model.HttpMethods
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
import ch.megard.akka.http.cors.scaladsl.settings.CorsSettings
import ch.megard.akka.http.cors.scaladsl.CorsDirectives._
import akka.http.scaladsl.model.HttpMethods
import ch.megard.akka.http.cors.scaladsl.settings.CorsSettings
import ch.megard.akka.http.cors.scaladsl.model.HttpOriginMatcher
import ch.megard.akka.http.cors.scaladsl.CorsDirectives._
import akka.http.scaladsl.model.HttpMethods
import scala.collection.mutable
import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}
import java.time.Instant



object DatabaseService {
  val url = "jdbc:mysql://localhost:3306/portefeuille"
  val user = "root"
  val password = "cytech0001"

  def getConnection: Connection = {
    DriverManager.getConnection(url, user, password)
  }
}
case class PriceHistoryEntry(price: Double, timestamp: Long)
case class Portfolio(userId: String, symbol: String, quantity: Int, totalPrice: Double)
case class AddAssetRequest(symbol: String, quantity: Int)
case class StockPrice(symbol: String, price: Double, timestamp: Long)
case class User(username: String, password: String)
case class LoginResponse(token: String)
case class MarketData(symbol: String, price: Double, change: Double)

trait JsonSupport extends DefaultJsonProtocol {
  implicit val priceHistoryEntryFormat: RootJsonFormat[PriceHistoryEntry] = jsonFormat2(PriceHistoryEntry)
  implicit val portfolioFormat: RootJsonFormat[Portfolio] = jsonFormat4(Portfolio.apply)
  implicit val addAssetFormat: RootJsonFormat[AddAssetRequest] = jsonFormat2(AddAssetRequest.apply)
  implicit val stockPriceFormat: RootJsonFormat[StockPrice] = jsonFormat3(StockPrice.apply)
  implicit val userFormat: RootJsonFormat[User] = jsonFormat2(User.apply)
  implicit val loginResponseFormat: RootJsonFormat[LoginResponse] = jsonFormat1(LoginResponse.apply)
  implicit val marketDataFormat: RootJsonFormat[MarketData] = jsonFormat3(MarketData.apply)
  implicit val userUnmarshaller: Unmarshaller[HttpEntity, User] = sprayJsonUnmarshaller[User].forContentTypes(akka.http.scaladsl.model.ContentTypes.`application/json`)
}

import scala.concurrent.{ExecutionContext, Future}
import java.sql.{Connection, DriverManager, PreparedStatement, ResultSet}

import scala.concurrent.{ExecutionContext, Future}
import java.sql.{Connection, DriverManager, PreparedStatement, ResultSet}

import scala.concurrent.{ExecutionContext, Future}
import java.sql.{Connection, DriverManager, PreparedStatement, ResultSet}
import scala.concurrent.Await
import scala.concurrent.duration._

object PortfolioRepository {
  def getConnection: Connection = {
    val url = "jdbc:mysql://localhost:3306/portefeuille"
    val user = "root"
    val password = "cytech0001"
    DriverManager.getConnection(url, user, password)
  }
  def getTotalInvested(userId: String): Future[Double] = Future {
    val conn = getConnection
    val stmt = conn.prepareStatement("SELECT symbol, quantity FROM portfolios WHERE user_id = ?")
    stmt.setString(1, userId)
    val rs = stmt.executeQuery()

    // Récupération de tous les actifs détenus par l'utilisateur
    val assets = Iterator.continually((rs.next(), rs)).takeWhile(_._1).map { case (_, row) =>
      val symbol = row.getString("symbol")
      val quantity = row.getInt("quantity")
      (symbol, quantity)
    }.toList

    rs.close()
    stmt.close()
    conn.close()

    // Calculer la valeur totale des actifs en fonction des PRIX ACTUELS
    val totalInvested = assets.map { case (symbol, quantity) =>
      val marketData = Await.result(FinnhubService.fetchStockPrice(symbol), 5.seconds)
      marketData.price * quantity
    }.sum

    println(s" [DEBUG] Total investi CALCULÉ avec PRIX ACTUELS pour $userId : $totalInvested €")
    totalInvested
  }(ExecutionContext.global)

  def addAsset(portfolio: Portfolio): Future[Int] = Future {
    val conn = getConnection

    // Récupérer le prix actuel via Finnhub
    val currentPrice = Await.result(FinnhubService.fetchStockPrice(portfolio.symbol), 5.seconds).price
    val totalPrice = currentPrice * portfolio.quantity

    val stmt = conn.prepareStatement(
      """
        INSERT INTO portfolios (user_id, symbol, quantity, total_price)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            quantity = quantity + VALUES(quantity),
            total_price = quantity * ?
      """
    )

    stmt.setString(1, portfolio.userId)
    stmt.setString(2, portfolio.symbol)
    stmt.setInt(3, portfolio.quantity)
    stmt.setDouble(4, totalPrice)
    stmt.setDouble(5, currentPrice)

    println(s" [DEBUG] Ajout de ${portfolio.quantity}x ${portfolio.symbol} au prix actuel de $currentPrice €")

    val result = stmt.executeUpdate()
    stmt.close()
    conn.close()
    result
  }(ExecutionContext.global)

  // Récupérer le portefeuille avec VALEURS ACTUALISÉES
  def getPortfolio(userId: String): Future[List[Portfolio]] = Future {
    val conn = getConnection
    val stmt = conn.prepareStatement("SELECT symbol, quantity FROM portfolios WHERE user_id = ?")
    stmt.setString(1, userId)
    val rs = stmt.executeQuery()

    val assets = Iterator.continually((rs.next(), rs)).takeWhile(_._1).map { case (_, row) =>
      val symbol = row.getString("symbol")
      val quantity = row.getInt("quantity")
      (symbol, quantity)
    }.toList

    rs.close()
    stmt.close()
    conn.close()

    // Récupération des prix ACTUELS pour recalculer la valeur totale
    val updatedAssets = assets.map { case (symbol, quantity) =>
      val marketData = Await.result(FinnhubService.fetchStockPrice(symbol), 5.seconds)
      Portfolio(userId, symbol, quantity, marketData.price * quantity)
    }

    println(s" [DEBUG] Portefeuille récupéré avec prix ACTUALISÉS pour $userId : $updatedAssets")
    updatedAssets
  }(ExecutionContext.global)

  //Retirer un actif en recalculant avec le prix ACTUEL
  def removeAsset(portfolio: Portfolio): Future[Int] = Future {
    val conn = getConnection

    // Récupérer le prix actuel via Finnhub
    val currentPrice = Await.result(FinnhubService.fetchStockPrice(portfolio.symbol), 5.seconds).price
    val amountToRemove = currentPrice * portfolio.quantity

    val stmt = conn.prepareStatement(
      """
          UPDATE portfolios
          SET quantity = quantity - ?,
              total_price = quantity * ?
          WHERE user_id = ? AND symbol = ? AND quantity >= ?
      """
    )
    stmt.setInt(1, portfolio.quantity)
    stmt.setDouble(2, currentPrice)
    stmt.setString(3, portfolio.userId)
    stmt.setString(4, portfolio.symbol)
    stmt.setInt(5, portfolio.quantity)

    println(s"[DEBUG] Retrait de ${portfolio.quantity}x ${portfolio.symbol} au prix actuel de $currentPrice €")

    val result = stmt.executeUpdate()
    val resetStmt = conn.prepareStatement(
      """
          UPDATE portfolios
          SET total_price = 0
          WHERE user_id = ? AND symbol = ? AND quantity = 0
      """
    )
    resetStmt.setString(1, portfolio.userId)
    resetStmt.setString(2, portfolio.symbol)
    resetStmt.executeUpdate()

    stmt.close()
    resetStmt.close()
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

  import java.time.Clock

  def authenticateUser(username: String, password: String)(implicit ec: ExecutionContext): Future[Option[String]] = Future {
    implicit val clock: Clock = Clock.systemUTC()

    var conn: Connection = null
    var stmt: PreparedStatement = null
    var rs: ResultSet = null

    try {
      conn = DatabaseService.getConnection
      stmt = conn.prepareStatement("SELECT password FROM users WHERE username = ?")
      stmt.setString(1, username)
      rs = stmt.executeQuery()

      if (rs.next()) {
        val storedPassword = rs.getString("password")
        if (password == storedPassword) {
          val claim = JwtClaim(
            s"""{"username": "$username", "timestamp": ${System.currentTimeMillis()}}"""
          ).issuedNow.expiresIn(3600)

          Some(Jwt.encode(claim, "secretKey", JwtAlgorithm.HS256))
        } else {
          None
        }
      } else {
        None
      }
    } catch {
      case ex: Exception =>
        println(s"Erreur lors de l'authentification de $username : ${ex.getMessage}")
        None
    } finally {
      if (rs != null) rs.close()
      if (stmt != null) stmt.close()
      if (conn != null) conn.close()
    }
  }
}

object FinnhubService {
  val apiKey = "cv1k6i9r01qngf095mj0cv1k6i9r01qngf095mjg"
  implicit val backend: SttpBackend[Identity, Any] = HttpURLConnectionBackend()

  def fetchStockPrice(symbol: String): Future[MarketData] = Future {
    MarketCache.get(symbol) match {
      case Some(price) =>
        MarketData(symbol, price, 0.0) // Retourne le prix en cache

      case None =>
        val request = basicRequest.get(uri"https://finnhub.io/api/v1/quote?symbol=$symbol&token=$apiKey")
        val response = request.send(backend)

        response.body match {
          case Right(body) =>
            val json = body.parseJson.asJsObject
            val currentPrice = json.fields.get("c").flatMap(_.convertTo[Option[Double]]).getOrElse(0.0)

            val conn = DatabaseService.getConnection

            //Récupère les valeurs précédentes triées par timestamp DESC
            val historyStmt = conn.prepareStatement(
              """
              SELECT price FROM price_history
              WHERE symbol = ?
              ORDER BY timestamp DESC
              """
            )
            historyStmt.setString(1, symbol)
            val historyRs = historyStmt.executeQuery()

            var lastDifferentPrice = currentPrice
            var foundDifferentPrice = false

            while (historyRs.next() && !foundDifferentPrice) {
              val prevPrice = historyRs.getDouble("price")
              if (prevPrice != currentPrice) {
                lastDifferentPrice = prevPrice
                foundDifferentPrice = true
              }
            }

            historyRs.close()
            historyStmt.close()

            val priceChangePercent = if (lastDifferentPrice > 0) ((currentPrice - lastDifferentPrice) / lastDifferentPrice) * 100 else 0.0

            // Ajoute la nouvelle valeur dans l'historique **seulement si différente**
            if (currentPrice != lastDifferentPrice) {
              val insertStmt = conn.prepareStatement(
                "INSERT INTO price_history (symbol, price, timestamp) VALUES (?, ?, NOW())"
              )
              insertStmt.setString(1, symbol)
              insertStmt.setDouble(2, currentPrice)
              insertStmt.executeUpdate()
              insertStmt.close()
            }

            conn.close()

            //Stocke en cache pour éviter trop d'appels API
            MarketCache.set(symbol, currentPrice)

            println(s"[API] Prix actuel pour $symbol: $currentPrice€, Dernière valeur différente: $lastDifferentPrice€, Évolution: $priceChangePercent%")

            MarketData(symbol, currentPrice, priceChangePercent)

          case Left(error) =>
            println(s"[API ERROR] Erreur Finnhub: $error")
            throw new Exception(s"Erreur API Finnhub: $error")
        }
    }
  }(ExecutionContext.global)
}

object PortfolioRoutes extends JsonSupport {
  implicit val ec: ExecutionContext = ExecutionContext.global

  def routes: Route =
    concat(
      //Route pour voir le portefeuille d'un utilisateur
      path("portfolio" / Segment) { userId =>
        get {
          onSuccess(PortfolioRepository.getPortfolio(userId)) { result =>
            complete(result)
          }
        }
      },

      //Route pour obtenir le total investi
      path("portfolio" / Segment / "total-invested") { userId =>
        println(s"[DEBUG] API total-invested appelée avec userId: $userId")
        get {
          onSuccess(PortfolioRepository.getTotalInvested(userId)) { total =>
            println(s"[DEBUG] Total investi récupéré pour $userId : $total €")
            complete(Map("totalInvested" -> total).toJson)
          }
        }
      },

      // Route pour ajouter un actif avec le prix mis à jour
      path("portfolio" / Segment / "add") { userId =>
        post {
          entity(as[AddAssetRequest]) { assetRequest =>
            onSuccess(FinnhubService.fetchStockPrice(assetRequest.symbol)) { stockData =>
              if (stockData.price <= 0) {
                complete(StatusCodes.BadRequest, "Le symbole de l'action est invalide ou inexistant")
              } else {
                val totalPrice = stockData.price * assetRequest.quantity
                val portfolio = Portfolio(userId, assetRequest.symbol, assetRequest.quantity, totalPrice)
                onSuccess(PortfolioRepository.addAsset(portfolio)) { _ =>
                  complete(StatusCodes.OK, "Actif ajouté avec prix mis à jour")
                }
              }
            }
          }
        }
      },

      //Route pour supprimer un actif avec mise à jour du total_price
      path("portfolio" / Segment / "remove") { userId =>
        post {
          entity(as[AddAssetRequest]) { assetRequest =>
            val portfolio = Portfolio(userId, assetRequest.symbol, assetRequest.quantity, 0)
            onSuccess(PortfolioRepository.removeAsset(portfolio)) { _ =>
              complete(StatusCodes.OK, "Actif supprimé avec prix mis à jour")
            }
          }
        }
      }
    )
}

import scala.collection.mutable

object MarketCache {
  private val cache = mutable.Map[String, (Double, Instant)]()
  private val cacheDuration = 5.minutes //Durée du cache (5 minutes)

  // Vérifie si l'action est dans le cache et encore valide
  def get(symbol: String): Option[Double] = {
    cache.get(symbol) match {
      case Some((price, timestamp)) if Instant.now().isBefore(timestamp.plusSeconds(cacheDuration.toSeconds)) =>
        println(s"[CACHE] Prix récupéré pour $symbol : $price €")
        Some(price) // Retourne le prix en cache
      case _ =>
        None
    }
  }

  //Stocke un prix dans le cache avec un timestamp actuel
  def set(symbol: String, price: Double): Unit = {
    cache.update(symbol, (price, Instant.now()))
    println(s"[CACHE] Prix stocké pour $symbol : $price € (cache valide 5 min)")
  }
}
object MarketRoutes extends JsonSupport {
  import ch.megard.akka.http.cors.scaladsl.CorsDirectives._

  def routes(implicit ec: ExecutionContext) =
    concat(
      path("market-data") {
        get {
          parameter("symbols") { symbols =>
            val symbolList = symbols.split(",").toList
            val futureMarketData = Future.sequence(symbolList.map(FinnhubService.fetchStockPrice))

            onComplete(futureMarketData) {
              case scala.util.Success(data) => complete(data)
              case scala.util.Failure(ex)   => complete(StatusCodes.InternalServerError, s"Erreur API : ${ex.getMessage}")
            }
          }
        }
      },

      path("price-history" / Segment) { symbol =>
        get {
          val query = "SELECT price, timestamp FROM price_history WHERE symbol = ? ORDER BY timestamp ASC"
          val conn = DatabaseService.getConnection
          val stmt = conn.prepareStatement(query)
          stmt.setString(1, symbol)
          val rs = stmt.executeQuery()

          val history: List[PriceHistoryEntry] = Iterator.continually((rs.next(), rs))
            .takeWhile(_._1)
            .map { case (_, row) =>
              val price = row.getDouble("price")
              val timestamp = row.getTimestamp("timestamp").getTime
              println(s"[DEBUG] Prix: $price, Timestamp: $timestamp")
              PriceHistoryEntry(price, timestamp)
            }.toList

          rs.close()
          stmt.close()
          conn.close()

          complete(history)
        }
      },

      path("price-fluctuation" / Segment) { symbol =>
        get {
          val query = "SELECT price, UNIX_TIMESTAMP(timestamp) * 1000 as timestamp FROM price_history WHERE symbol = ? ORDER BY timestamp ASC"
          val conn = DatabaseService.getConnection
          val stmt = conn.prepareStatement(query)
          stmt.setString(1, symbol)
          val rs = stmt.executeQuery()

          val history: List[PriceHistoryEntry] = Iterator.continually((rs.next(), rs))
            .takeWhile(_._1)
            .map { case (_, row) =>
              val price = row.getDouble("price")
              val timestamp = row.getLong("timestamp") // Conversion en `Long`
              println(s"[DEBUG] Prix: $price, Timestamp: $timestamp")
              PriceHistoryEntry(price, timestamp)
            }.toList

          rs.close()
          stmt.close()
          conn.close()

          //Ajoute le prix actuel via Finnhub API
          onSuccess(FinnhubService.fetchStockPrice(symbol)) { currentPrice =>
            val updatedHistory = history :+ PriceHistoryEntry(currentPrice.price, System.currentTimeMillis())
            println(s"[DEBUG] Données finales envoyées au frontend: $updatedHistory")
            complete(updatedHistory)
          }
        }
      }
    )
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
              case Some(token) => complete(LoginResponse(token.toString))
              case None => complete(StatusCodes.Unauthorized, "Invalid credentials")
            }
          }
        }
      }
}

object Main extends App {
  implicit val system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "PortfolioSystem")
  implicit val executionContext: ExecutionContext = system.executionContext

  val corsSettings = CorsSettings.defaultSettings
    .withAllowGenericHttpRequests(true)
    .withAllowedOrigins(HttpOriginMatcher.*)
    .withAllowedMethods(Seq(HttpMethods.GET, HttpMethods.POST, HttpMethods.PUT, HttpMethods.DELETE, HttpMethods.OPTIONS))
    .withAllowedHeaders(HttpHeaderRange.*)

  val corsRoutes = cors(corsSettings) {
    concat(
      AuthRoutes.routes,
      PortfolioRoutes.routes,
      MarketRoutes.routes
    )
  }

  Http().newServerAt("localhost", 9000).bind(corsRoutes)
  println("Serveur Portfolio démarré sur http://localhost:9000")
}




