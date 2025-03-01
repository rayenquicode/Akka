//> using dep com.typesafe.akka::akka-actor-typed:2.8.8
//> using dep com.typesafe.akka::akka-stream:2.8.8
//> using dep com.typesafe.akka::akka-http:10.5.3
//> using dep com.typesafe.akka::akka-http-spray-json:10.5.3
//> using dep io.spray::spray-json:1.3.6
//> using dep com.softwaremill.sttp.client3::core:3.10.3
//> using dep com.softwaremill.sttp.client3::async-http-client-backend-future:3.10.3

import akka.actor.typed._
import akka.actor.typed.scaladsl._
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.model._
import scala.concurrent.{Future, ExecutionContextExecutor}
import sttp.client3._
import sttp.client3.asynchttpclient.future.AsyncHttpClientFutureBackend
import spray.json._
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import spray.json.DefaultJsonProtocol._
import akka.util.Timeout
import akka.actor.typed.scaladsl.AskPattern._ // ✅ Ajout du bon import

import scala.concurrent.duration._
import scala.util.{Success, Failure}

trait JsonSupport extends DefaultJsonProtocol {
  implicit val stockFormat: RootJsonFormat[StockPrice] = jsonFormat2(StockPrice.apply)
}
case class StockPrice(symbol: String, price: Double)

object YahooFinanceService {
  val yahooUrl = "https://query1.finance.yahoo.com/v7/finance/quote?symbols="

  def getStockPrice(symbol: String)(implicit ec: ExecutionContextExecutor): Future[String] = {
    implicit val backend: SttpBackend[Future, Any] = AsyncHttpClientFutureBackend()

    val responseFuture = basicRequest.get(uri"$yahooUrl$symbol").send(backend)

    responseFuture.map(_.body.fold(
      _ => """{"error": "Impossible de récupérer les données"}""",
      identity
    ))
  }
}

object UserManager {
  sealed trait Command
  case class CreateUser(name: String, replyTo: ActorRef[String]) extends Command
  case class DeleteUser(name: String, replyTo: ActorRef[String]) extends Command
  case class ListUsers(replyTo: ActorRef[String]) extends Command

  def apply(): Behavior[Command] = Behaviors.setup { context =>
    var users = Set[String]()

    Behaviors.receiveMessage {
      case CreateUser(name, replyTo) =>
        users += name
        context.log.info(s"Utilisateur créé : $name")
        replyTo ! s"Utilisateur $name créé"
        Behaviors.same

      case DeleteUser(name, replyTo) =>
        users -= name
        context.log.info(s"Utilisateur supprimé : $name")
        replyTo ! s"Utilisateur $name supprimé"
        Behaviors.same

      case ListUsers(replyTo) =>
        val userList = users.mkString(", ")
        context.log.info(s"Liste des utilisateurs : $userList")
        replyTo ! userList
        Behaviors.same
    }
  }
}

object Main extends App with JsonSupport {
  implicit val system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "GestionPortefeuille")
  implicit val executionContext: ExecutionContextExecutor = system.executionContext
  implicit val timeout: Timeout = Timeout(5.seconds) // ✅ Timeout obligatoire
  implicit val scheduler: Scheduler = system.scheduler // ✅ Ajout du Scheduler requis pour `ask`

  val userManager: ActorSystem[UserManager.Command] = ActorSystem(UserManager(), "UserManager")

  val route =
    concat(
      path("yahoo-price" / Segment) { symbol =>
        get {
          onComplete(YahooFinanceService.getStockPrice(symbol)) {
            case Success(priceData) =>
              complete(HttpEntity(ContentTypes.`application/json`, priceData))
            case Failure(ex) =>
              complete(HttpEntity(ContentTypes.`application/json`, s"""{"error": "Erreur : ${ex.getMessage}"}"""))
          }
        }
      },
      path("create-user" / Segment) { name =>
        get {
          val responseFuture: Future[String] = userManager.ask(replyTo => UserManager.CreateUser(name, replyTo))
          onComplete(responseFuture) {
            case Success(response) => complete(response)
            case Failure(ex) => complete(s"Erreur lors de la création de l'utilisateur : ${ex.getMessage}")
          }
        }
      },
      path("list-users") {
        get {
          val responseFuture: Future[String] = userManager.ask(replyTo => UserManager.ListUsers(replyTo))
          onComplete(responseFuture) {
            case Success(response) => complete(response)
            case Failure(ex) => complete(s"Erreur lors de la récupération des utilisateurs : ${ex.getMessage}")
          }
        }
      }
    )

  val bindingFuture = Http().newServerAt("localhost", 8080).bind(route)
  println("🚀 Serveur API Yahoo Finance démarré sur http://localhost:8080")
}
