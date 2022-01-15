const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
	const { Books } = this.entities;
	const service = await cds.connect.to('RemoteKafka');
	this.on('READ', Books, request => {
		return service.tx(request).run(request.query);
	});
    this.on("callKafka". Books, req => {
        return service.send("1",{"isbn":"2"})
    });
});