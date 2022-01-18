var socks = require("@luminati-io/socksv5");
var STATE_AUTHTYPE = 0,
    STATE_AUTHSTATUS = 1;


var client = socks.connect({
    host: 'google.com',
    port: 80,
    proxyHost:  '127.0.0.1', //'connectivityproxy.internal.cf.eu10.hana.ondemand.com',
    proxyPort:  1080, //20004,
    auths: [  socks.auth.None()
/*        
        {
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
                                cb(new Error("Unsupported auth request version: " + chunk[i]));
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
    }
    */
]
}, function(socket) {
    workWithKafka(socket)
    console.log('>> Connection successful');
    socket.write('GET /node.js/rules HTTP/1.0\r\n\r\n');
    socket.pipe(process.stdout);
});
    
async function workWithKafka(socket) {
    var myCustomSocketFactory = ({
        host,
        port,
        ssl,
        onConnect
    }) => {
        socket.setKeepAlive(true, 60 * 60 * 1000)
        onConnect();
        return socket;
    };

    var broker = ["kafka.cloud:9092"];

    const kafka = new Kafka({
        clientId: "dw-client",
        brokers: broker,
        retry: {
            initialRetryTime: 5000,
            retries: 2,
        },
        requestTimeout: 30000,
        authenticationTimeout: 7000,
        socketFactory: myCustomSocketFactory,
        logLevel: logLevel.ERROR
    });

    const producer = kafka.producer();
    const consumer = kafka.consumer({
        groupId: "test-group"
    });

    const run = async () => {
        // Producing
        await producer.connect();
        await producer.send({
            topic: "nodejs-trial",
            messages: [{
                value: "Hello KafkaJS user!"
            }],
        });
        console.log("Message is sent");

        // Consuming
        await consumer.connect();
        await consumer.subscribe({
            topic: "nodejs-trial",
            fromBeginning: true,
        });

        await consumer.run({
            eachMessage: async ({
                topic,
                partition,
                message
            }) => {
                console.log({
                    partition,
                    offset: message.offset,
                    value: message.value.toString(),
                });
            },
        });

        await producer.send({
            topic: "test-topic",
            messages: [{
                value: "I want more"
            }],
        });
    };

    run().catch(console.error);
}
