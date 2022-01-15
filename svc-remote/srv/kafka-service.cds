using de.barmer.connect.kafka as my from '../db/data-model';

service KafkaService @(path:'kafka') {
    @readonly entity Books as projection on my.Books;

    action send(isbn : String) returns { returnMesage : String};
}