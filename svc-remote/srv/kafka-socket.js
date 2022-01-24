const socks = require("@luminati-io/socksv5");
const STATE_AUTHTYPE = 0,
  STATE_AUTHSTATUS = 1;
  

class KafkaClient {
    constructor(host, port, proxyHost, proxyPort, kafkaBrokers) {
        console.log("constructor()")
        this.host = host
        this.port = port
        this.proxyHost = proxyHost
        this.proxyPort = proxyPort
        this.kafkaBrokers = kafkaBrokers    
        this.socket = {}
    }

    send(topic, payload) {
        console.log("send()")
        console.log("topic: ", topic, "payload:", payload)     
        console.log("socket:", socket)   
    }

    connect() {
        console.log("connect")

        socks.connect(
            {
              host: this.host, //virtual kafka host in SCC
              port: this.port, //virtual kafka port in SCC
              proxyHost: this.proxyHost, //'connectivityproxy.internal.cf.eu10.hana.ondemand.com',
              proxyPort: this.proxyPort, // 20004,
              auths: [
                socks.auth.None(), //this.authentication
              ],
            },
            function (socket) {
              this.socket = socket;
              console.log(">> Connection successful");
              // kafkaworker(socket, kafkaBrokers);
            }
          )        
    }       
    
    authentication () {
        return {
            METHOD: 0x80,
            client: function clientHandler(stream, cb) {
              var state = STATE_AUTHTYPE;
      
              function onData(chunk) {
                var i = 0,
                  len = chunk.length;
                while (i < len) {
                  switch (state) {
                    case STATE_AUTHTYPE:
                      if (chunk[i] !== 0x01) {
                        stream.removeListener("data", onData);
                        cb(
                          new Error("Unsupported auth request version: " + chunk[i])
                        );
                        return;
                      }
                      ++i;
                      state = STATE_AUTHSTATUS;
                      break;
                    case STATE_AUTHSTATUS:
                      var status = chunk[i];
                      ++i;
                      state = null;
                      stream.removeListener("data", onData);
                      cb(status === 0);
                      return;
                      break;
                  }
                }
              }
      
              stream.on("data", onData);
      
              // === Authenticate ==
              // Send the following bytes
              // 1 byte - authentication method version: 1
              // 4 bytes - length of JWT token acquired from XSUAA OAuth
              // X bytes - The content of JWT token acquired from XSUAA OAuth
              // 1 byte - Length of Cloud Connector location ID: Currently 0 because we don't CC locations
              // Y bytes - The content of location ID
              var len = Buffer.byteLength(jwtToken, "utf8");
              var buf = Buffer.alloc(5 + 1 + len); //10 +
              buf[0] = 0x01;
              var pos = 1;
              pos = buf.writeInt32BE(len, pos);
              pos = buf.write(jwtToken, pos);
              pos += 5;
              buf[pos] = 0x00;
      
              //console.log(buf.toString("hex").match(/../g).join(" "));
              stream.write(buf);
            }
        }
    }
}

const kafkaClient = {
  host: "virtual.kafka",
  port: 80,
  proxyHost: "connectivityproxy.internal.cf.eu10.hana.ondemand.com",
  proxyPort: 20004,
  kafkaBrokers: ["kafka:9092"],
  socket: {}, //will be set after successfull connection
}
kafkaClient.send = 
  function (topic, payload) {
    console.log("workWithKafka");
    if (!payload) payload = { message: "Hi bConnect Kafka" };

    var myCustomSocketFactory = ({ host, port, ssl, onConnect }) => {
      socket.setKeepAlive(true, 60 * 60 * 1000);
      onConnect();
      return socket;
    };

    // var broker = ["kafka:9092"];

    const kafka = new Kafka({
      clientId: "kafka-client",
      brokers: kafkaBrokers,
      retry: {
        initialRetryTime: 5000,
        retries: 2,
      },
      requestTimeout: 30000,
      authenticationTimeout: 7000,
      socketFactory: myCustomSocketFactory,
      logLevel: logLevel.ERROR,
    });

    const producer = kafka.producer();

    const run = async () => {
      // Producing
      await producer.connect();
      await producer.send({
        topic: topic,
        messages: [
          {
            value: payload,
          },
        ],
      });
      console.log("Message is sent to kafka server");
    };

    run().catch(console.error);
  }
/*
kafkaClient.connect = function (
    host,
    port,
    proxyHost,
    proxyPort,
    kafkaBrokers
  ) {
    this.host = host;
    this.port = port;
    this.proxyHost = proxyHost;
    this.proxyPort = proxyPort;
    this.kafkaBrokers = kafkaBrokers;

    this.authentication = {
      METHOD: 0x80,
      client: function clientHandler(stream, cb) {
        var state = STATE_AUTHTYPE;

        function onData(chunk) {
          var i = 0,
            len = chunk.length;
          while (i < len) {
            switch (state) {
              case STATE_AUTHTYPE:
                if (chunk[i] !== 0x01) {
                  stream.removeListener("data", onData);
                  cb(
                    new Error("Unsupported auth request version: " + chunk[i])
                  );
                  return;
                }
                ++i;
                state = STATE_AUTHSTATUS;
                break;
              case STATE_AUTHSTATUS:
                var status = chunk[i];
                ++i;
                state = null;
                stream.removeListener("data", onData);
                cb(status === 0);
                return;
                break;
            }
          }
        }

        stream.on("data", onData);

        // === Authenticate ==
        // Send the following bytes
        // 1 byte - authentication method version: 1
        // 4 bytes - length of JWT token acquired from XSUAA OAuth
        // X bytes - The content of JWT token acquired from XSUAA OAuth
        // 1 byte - Length of Cloud Connector location ID: Currently 0 because we don't CC locations
        // Y bytes - The content of location ID
        var len = Buffer.byteLength(jwtToken, "utf8");
        var buf = Buffer.alloc(5 + 1 + len); //10 +
        buf[0] = 0x01;
        var pos = 1;
        pos = buf.writeInt32BE(len, pos);
        pos = buf.write(jwtToken, pos);
        pos += 5;
        buf[pos] = 0x00;

        //console.log(buf.toString("hex").match(/../g).join(" "));
        stream.write(buf);
      },
    };

    socks.connect(
      {
        host: host, //virtual kafka host in SCC
        port: port, //virtual kafka port in SCC
        proxyHost: proxyHost, //'connectivityproxy.internal.cf.eu10.hana.ondemand.com',
        proxyPort: proxyPort, // 20004,
        auths: [
          socks.auth.None(), //this.authentication
        ],
      },
      function (socket) {
        this.socket = socket;
        console.log(">> Connection successful");
        // kafkaworker(socket, kafkaBrokers);
      }
    );
  }
}
*/

exports = {KafkaClient};
