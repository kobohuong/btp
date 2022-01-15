const cds = require('@sap/cds')
process.env.PORT = 4005

class KafkaService extends cds.ApplicationService { init() {

    this.on('send', async req => {
        const {id, payload} = req.data
        console.log(`Id: $id`);
        console.log(`Payload: $payload`);
        return { id, payload }
    })

    return super.init()
}}

module.exports = { KafkaService }