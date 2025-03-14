name := "GestionPortefeuille"

version := "0.1"

scalaVersion := "2.13.14"

libraryDependencies ++= Seq(
  "com.github.jwt-scala" %% "jwt-core" % "9.0.5",
  "org.mindrot" % "jbcrypt" % "0.4",
  "com.typesafe.akka" %% "akka-actor-typed" % "2.8.0",
  "ch.qos.logback" % "logback-classic" % "1.5.17",
  "com.typesafe.akka" %% "akka-stream" % "2.8.0",
  "com.typesafe.akka" %% "akka-http" % "10.5.0",
  "com.typesafe.akka" %% "akka-http-spray-json" % "10.5.0",
  "io.spray" %% "spray-json" % "1.3.6",
  "com.softwaremill.sttp.client3" %% "core" % "3.10.3",
  "ch.megard" %% "akka-http-cors" % "1.1.3",
  "com.softwaremill.sttp.client3" %% "async-http-client-backend-future" % "3.10.3",
  "mysql" % "mysql-connector-java" % "8.0.33"
)
