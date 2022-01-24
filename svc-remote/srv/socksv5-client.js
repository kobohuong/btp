var socks = require('@luminati-io/socksv5');
 
var client = socks.connect({
  host: 'google.com',
  port: 80,
  proxyHost: '127.0.0.1',
  proxyPort: 1080,
  auths: [ socks.auth.None() ]
}, async function(socket) {
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
