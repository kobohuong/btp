const cds = require ('@sap/cds')



module.exports = (srv) =>  {
  const { Events, EventServiceMappings, EventStatuses } = srv.entities

  const db  =  cds.connect.to('db')
  

  srv.on('send', async(req) => {
    const topic = 'barmer/em/replication'

         
    var data = { 
      'myProp': 'Sending message. Current Time: ' + new Date().toLocaleString()
    }

    cds.foreach('Events', each =>   srv.emit (topic, data)  )
    
    const events = await srv.tx(req).run(SELECT.from(Events))

    // data = await collectData(req)

    
    return events
    
  })

  async function collectData(req) {
    let data = {}
    const events = await cds.read(Events)
   
    events.foreach(e => {
         data =  { 'myProp': 'Sending message. Current Time: ' + new Date().toLocaleString() }
    } )

    return data
        
  }
  
 }