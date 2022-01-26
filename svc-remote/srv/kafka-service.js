const cds = require('@sap/cds')
const process = require('process')
const fs = require('fs')

const log = cds.log("svc-remote-srv")
cds.env.log.levels = { app: 'debug', db: 'debug' }
//const logging = require('@sap/logging')

//const appContext = logging.createAppContext();

//let log = appContext.getLogger('/home/vcap/logs'); 

//const kafkaHost = process.env.CF_APP_KAFKA_HOST
//const kafkaPort = process.env.CF_APP_KAKF_PORT
//const proxyHost = "connectivityproxy.internal.cf.us10.hana.ondemand.com"
//const proxyPort = 20004
//const kafkaBrokers = ["kafka:9092"]

// Logging information
//const log = require('cf-nodejs-logging-support');
//const log = cds.log('svc-remote-srv')
//log.setLoggingLevel('info');


class KafkaClient {
    init() {
        asyncInitialRunFn()
    }
  
    constructor() {
        log.info("KafkaClient: constructor()")
        this.init()
    }
    send(topic, payload) {
        log.info("send()")
        log.debug("topic: ", topic, "payload:", payload)        
    }

    connect() {
        log.info("connect")
    }        
}

class KafkaService extends cds.ApplicationService { init() {

    this.on('send', async req => {
        const { payload} = req.data

        log.debug("Payload:", payload);
        const kkClient = new KafkaClient()
        const topic = "test-topic"        
        kkClient.send(topic, payload)

        return {  "message":"sent" }
    })

    return super.init()
}}

const { Kafka, logLevel } = require('kafkajs');

// XS-Advanced environment variables
const xsenv = require('@sap/xsenv');
const oauthClient = require('client-oauth2');


// get the connectivity service for Kafka connection
const connService = xsenv.getServices({
	connectivity: function (service) {
		return service.label === 'connectivity';
	}
}).connectivity;

// enhance String with new func to get bytes for STOMP5 protocol
String.prototype.getBytes = function () {
	var bytes = [];
	for (var i = 0; i < this.length; ++i) {
		bytes.push(this.charCodeAt(i));
	}
	return bytes;
};

log.debug(process.env.destinations);
//const serviceURL = process.env.destinations[0].url;
const asyncInitialRunFn = async () => {

    log.info("asyncInitialRunFn()")
	const socketAliveTime = 60 * 60 * 1000;

	var socks = require('@luminati-io/socksv5');

	const _getTokenForDestinationService = function () {
		return new Promise((resolve, reject) => {
			let tokenEndpoint = connService.token_service_url + '/oauth/token';
			log.info("TokenEndpoint: " + tokenEndpoint)
            const client = new oauthClient({
				authorizationUri:
					connService.token_service_url + '/oauth/authorize',
				accessTokenUri: tokenEndpoint,
				clientId: connService.clientid,
				clientSecret: connService.clientsecret,
				scopes: [],
				grant_type: 'client_credentials'
			});
			client.credentials
				.getToken()
				.catch((error) => {
					return reject({
						message:
							'Error: failed to get access token for Connectivity service',
						error: error
					});
				})
				.then((result) => {
                    
					resolve(result.data.access_token);
				});
		});
	};

	const triggerListener = () => {
		_getTokenForDestinationService()
			.then((jwtToken) => {
				var STATE_VERSION = 0,
					STATE_RESPONSE = 1,
					STATE_2VERSION = 2,
					STATE_STATUS = 3;
                log.info("jwtToken: " + jwtToken)    
				// Establish a SOCKS5 handshake for TCP connection via connectivity service and Cloud Connector
				socks.connect(
					{
						host:  'kafka-e-broker01',
						port:   9094,
						proxyHost: connService.onpremise_proxy_host,
						proxyPort: parseInt(
							connService.onpremise_socks5_proxy_port,
							10
						),
						localDNS: false,
						strictLocalDNS: true,
						auths: [
							{
								METHOD: 0x80,
								client: function clientHandler(stream, cb) {
                                    log.info("BEGIN AUTH")
									var state = STATE_2VERSION;

									function onData(chunk) {
                                        log.info("onData()")
                                        log.info("Chunk: ", chunk)
										var i = 0,
											len = chunk.length;

										while (i < len) {
											console.log(chunk[i]);
											switch (state) {
												case STATE_2VERSION:
													if (chunk[i] !== 0x01) {
														stream.removeListener(
															'data',
															onData
														);
														cb(
															new Error(
																'Unsupported auth request version: ' +
																	chunk[i]
															)
														);
														return;
													}
													++i;
													state = STATE_STATUS;
													break;
												case STATE_STATUS:
													++i;
													state = STATE_VERSION;
													console.log(chunk);
													stream.removeListener(
														'data',
														onData
													);
													cb(true);
													return;
											}
										}
									}
                                    log.info("After while ")
                                    stream.on('data', onData);

									// === Authenticate ==
									// Send the following bytes
									// 1 byte - authentication method version: 1
									// 4 bytes - length of JWT token acquired from XSUAA OAuth
									// X bytes - The content of JWT token acquired from XSUAA OAuth
									// 1 byte - Length of Cloud Connector location ID: Currently 0 because we don't CC locations
									// Y bytes - The content of location ID
									var len = Buffer.byteLength(
										jwtToken,
										'utf8'
									);
									var buf = Buffer.alloc(5 + 1 + len); //10 +
									buf[0] = 0x01;
									var pos = 1;
									pos = buf.writeInt32BE(len, pos);
									pos = buf.write(jwtToken, pos);
									pos += 5;
                                    //cloud connector locationid
                                    //pos = buf.writeInt32BE(12, pos);
                                    //pos = buf.write('DEV_bConnect', pos);                                                                            
									buf[pos] = 0x00;
                                    log.info("Pos: ", pos)
                                    log.info("Buf: ", buf)        
									stream.write(buf);
                                    log.info("END AUTH ")

								}
							}
						]
					},
					function (socket) {
                        log.info(socket)
						startKafka(socket);
					}
				);
			})
			.catch((err) => {});

		function startKafka(socket) {
            log.info("startKafka")
			var myCustomSocketFactory = ({ host, port, ssl, onConnect }) => {
                log.debug("create customSocketFactory")
				socket.setKeepAlive(true, socketAliveTime);
				onConnect();
				return socket;
			};

			var broker = [
                ['kafka-e-broker01:9094', 'kafka-e-broker02:9094', 'kafka-e-broker03:9094']
            ];

			const kafka = new Kafka({
				clientId: 'kafka-client',
				brokers: broker,
				retry: {
					initialRetryTime: 5000,
					retries: 2
				},
                ssl: {
                    ca : fs.readFileSync("amazon.crt")
                },
				requestTimeout: 30000,
				authenticationTimeout: 7000,
				socketFactory: myCustomSocketFactory,
				logLevel: logLevel.ERROR
			});



              const producer = kafka.producer();
          
              const run = async () => {
                // Producing
                await producer.connect();
                await producer.send({
                  topic:  "tes-topic",
                  messages: [
                    {
                      value: "test payload",
                    },
                  ],
                });
                log.debug("Message is sent to kafka server")
              };
          
              run().catch(console.error);                      
		}
	};

	triggerListener();

	// Delay the socket restart interval
	setTimeout(() => {
		setInterval(function () {
			triggerListener();
		}, socketAliveTime);
	}, 1000);

};

// Ping - Pong Health
// const express = require('express');
// const app = express();

// app.get('/ping', function (req, res) {
// 	res.send('pong');
// });

// app.listen(8080);

module.exports = { KafkaService }