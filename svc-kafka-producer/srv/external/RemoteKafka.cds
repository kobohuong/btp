/* checksum : 69d9cf553e2a5af2ab043346e45a5e30 */
@cds.persistence.skip : true
entity RemoteKafka.Books {
  key ID : Integer;
  title : LargeString;
  stock : Integer;
};

action RemoteKafka.send(
  isbn : LargeString
) returns RemoteKafka.return_KafkaService_send;

type RemoteKafka.return_KafkaService_send {
  returnMesage : LargeString;
};

@cds.external : true
service RemoteKafka {};

