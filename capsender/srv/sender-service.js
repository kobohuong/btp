const cds = require ('@sap/cds')


module.exports = cds.service.impl ((srv) => {

  srv.on ('send', async(req)=>{
    const message = { 
      'myProp': 'Sending message. Current Time: ' + new Date().toLocaleString()
    }
  
    const topic = 'barmer/em/replication'
  
    srv.emit (topic, message)  

    return "Successfully sent event"
  })
})
