//> using dep com.typesafe.akka::akka-actor-typed:2.8.8
//> using dep com.typesafe.akka::akka-stream:2.8.8
//> using dep com.typesafe.akka::akka-http:10.5.3
//> using dep com.typesafe.akka::akka-http-spray-json:10.5.3
//> using dep io.spray::spray-json:1.3.6
//> using dep com.softwaremill.sttp.client3::core:3.9.2
//> using dep com.softwaremill.sttp.client3::async-http-client-backend-future:3.9.2

import akka.actor.typed._
import akka.actor.typed.scaladsl._
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.model._
import scala.concurrent.Future
import scala.concurrent.ExecutionContextExecutor
import sttp.client3._
import sttp.client3.asynchttpclient.future.AsyncHttpClientFutureBackend
import spray.json._
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import spray.json.DefaultJsonProtocol._

trait JsonSupport extends DefaultJsonProtocol {
  implicit val stockFormat: RootJsonFormat[StockPrice] = jsonFormat2(StockPrice.apply)
}
case class StockPrice(symbol: String, price: Double)

object YahooFinanceService {
  val yahooUrl = "https://query1.finance.yahoo.com/v7/finance/quote?symbols="

  def getStockPrice(symbol: String): Future[String] = {
    implicit val backend = AsyncHttpClientFutureBackend()
    Future {
      val response = basicRequest.get(uri"$yahooUrl$symbol").send(backend)
      response.body.getOrElse("""{"error": "Impossible de récupérer les données"}""")
    }(scala.concurrent.ExecutionContext.global)
  }
}

object UserManager {
  sealed trait Command
  case class CreateUser(name: String) extends Command
  case class DeleteUser(name: String) extends Command
  case object ListUsers extends Command

  def apply(): Behavior[Command] = Behaviors.setup { context =>
    var users = Set[String]()

    Behaviors.receiveMessage {
      case CreateUser(name) =>
        users += name
        context.log.info(s"Utilisateur créé : $name")
        Behaviors.same

      case DeleteUser(name) =>
        users -= name
        context.log.info(s"Utilisateur supprimé : $name")
        Behaviors.same

      case ListUsers =>
        context.log.info(s"Liste des utilisateurs : ${users.mkString(", ")}")
        Behaviors.same
    }
  }
}

object Main extends App with JsonSupport {
  implicit val system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "GestionPortefeuille")
  implicit val executionContext: ExecutionContextExecutor = system.executionContext

  val userManager: ActorSystem[UserManager.Command] = ActorSystem(UserManager(), "UserManager")

  val route =
    concat(
      path("yahoo-price" / Segment) { symbol =>
        get {
          onSuccess(YahooFinanceService.getStockPrice(symbol)) { priceData =>
            complete(HttpEntity(ContentTypes.`application/json`, priceData))
          }
        }
      },
      path("create-user" / Segment) { name =>
        get {
          userManager ! UserManager.CreateUser(name)
          complete(s"Utilisateur $name créé")
        }
      },
      path("list-users") {
        get {
          userManager ! UserManager.ListUsers
          complete("Liste des utilisateurs affichée dans les logs.")
        }
      }
    )

  val bindingFuture = Http().newServerAt("localhost", 8080).bind(route)
  println(" Serveur API Yahoo Finance démarré sur http://localhost:8080")
}
