const cds = require('@sap/cds')
const process = require('process')

const kafkaHost = process.env.CF_APP_KAFKA_HOST
const kafkaPort = process.env.CF_APP_KAKF_PORT
const proxyHost = "connectivityproxy.internal.cf.eu10.hana.ondemand.com"
const proxyPort = 20004
const kafkaBrokers=["kafka:9092"]

// Logging information
const log = require('cf-nodejs-logging-support');
log.setLoggingLevel('info');


class KafkaClient {
    constructor(host, port, proxyHost, proxyPort, kafkaBrokers) {
        log.info("KafkaClient: constructor()")
        this.host = host
        this.port = port
        this.proxyHost = proxyHost
        this.proxyPort = proxyPort
        this.kafkaBrokers = kafkaBrokers    
    }

    send(topic, payload) {
        log.info("send()")
        log.debug("topic: ", topic, "payload:", payload)        
    }

    connect() {
        asyncInitialRunFn();
        log.info("connect")
    }        
}

class KafkaService extends cds.ApplicationService { init() {

    this.on('send', async req => {
        const { payload} = req.data

        log.debug("Payload:", payload);
        const kkClient = new KafkaClient(kafkaHost, kafkaPort, proxyHost, proxyPort, kafkaBrokers)
        kkClient.connect()
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

console.log(process.env.destinations);
//const serviceURL = process.env.destinations[0].url;
const asyncInitialRunFn = async () => {


	const socketAliveTime = 60 * 60 * 1000;

	var socks = require('@luminati-io/socksv5');

	const _getTokenForDestinationService = function () {
		return new Promise((resolve, reject) => {
			let tokenEndpoint = connService.token_service_url + '/oauth/token';
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

				// Establish a SOCKS5 handshake for TCP connection via connectivity service and Cloud Connector
				socks.connect(
					{
						host: 'kafka-e-broker01',
						port: 9094,
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
									console.log('BEGIN AUTH');
									var state = STATE_2VERSION;

									function onData(chunk) {
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
									buf[pos] = 0x00;

									stream.write(buf);
								}
							}
						]
					},
					function (socket) {
						startKafka(socket);
					}
				);
			})
			.catch((err) => {});

		async function startKafka(socket) {
			var myCustomSocketFactory = ({ host, port, ssl, onConnect }) => {
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
                  topic: topic,
                  messages: [
                    {
                      value: "test payload",
                    },
                  ],
                });
                console.log("Message is sent to kafka server");
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

	console.log('async start');
};

// Ping - Pong Health
const express = require('express');
const app = express();

app.get('/ping', function (req, res) {
	res.send('pong');
});

app.listen(8080);

module.exports = { KafkaService }