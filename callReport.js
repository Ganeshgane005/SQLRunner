const soap = require('soap');
const xml2js = require('xml2js');  // Library to convert XML to JSON


// Oracle BI Publisher WSDL URL
const WSDL_URL = 'https://fa-etaj-saasfademo1.ds-fa.oraclepdemos.com/xmlpserver/services/v2/ReportService?wsdl';

// The base64-encoded query string parameter data (replace with your actual base64 data)
const encodedQuery = 'c2VsZWN0ICogZnJvbSBIWl9QQVJUSUVTIHdoZXJlIHBhcnR5X251bWJlciBpbiAoMyw0KQoK';

// Request Data
const args = {
  reportRequest: {
    parameterNameValues: {
      listOfParamNameValues: {
        item: {
          name: 'query1',
          values: {
            item: encodedQuery
          }
        }
      }
    },
    reportAbsolutePath: '/~natalie.salesrep/SQLRunner/SQLDataModel.xdm',
    sizeOfDataChunkDownload: -1
  },
  userID: 'natalie.salesrep',
  password: 'Yw#9S6T^'
};

// SOAP Request: Call the ReportService
soap.createClient(WSDL_URL, function (err, client) {
  if (err) {
    console.error('❌ Error creating SOAP client:', err);
    return;
  }

  // Call the 'runDataModel' method
  client.runDataModel(args, function (err, result, rawResponse, soapHeader, rawRequest) {
    if (err) {
      console.error('❌ runDataModel Error:', err.body || err);
      return;
    }

    // Extract the base64 encoded reportBytes from the response
    const reportBytes = result.runDataModelReturn.reportBytes;

    // Decode the base64 reportBytes to XML
    const decodedXML = Buffer.from(reportBytes, 'base64').toString('utf-8');

    // Convert XML to JSON using xml2js
    const parser = new xml2js.Parser();
    parser.parseString(decodedXML, function (err, jsonResult) {
      if (err) {
        console.error('❌ Error parsing XML to JSON:', err);
        return;
      }

      // Log or send the JSON response
      console.log('✅ Decoded JSON:', JSON.stringify(jsonResult, null, 2));
      
      // Optionally: Save the JSON result to a file (if needed)
      fs.writeFileSync('output.json', JSON.stringify(jsonResult, null, 2));
    });
  });
});
