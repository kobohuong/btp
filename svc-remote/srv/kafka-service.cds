//using de.barmer.connect.kafka as my from '../db/data-model';

service KafkaService @(path:'kafka-producer') {
//    @readonly entity Books as projection on my.Books;

    action send(payload : String) returns { returnMesage : String};
}