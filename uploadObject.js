// const soap = require('soap');

// // Oracle BI Publisher WSDL URL
// const WSDL_URL = 'https://fa-esll-saasfademo1.ds-fa.oraclepdemos.com/xmlpserver/services/v2/CatalogService?wsdl';

// // Replace with your actual credentials and data
// const args = {
//   reportObjectAbsolutePathURL: '/~natalie.salesrep/SQLRunner/SQLDataModel',
//   objectType: 'xdmz',
//   objectZippedData: `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`, // <-- Truncated base64 zipped data
//   userID: 'natalie.salesrep',
//   password: 'U5t%R#S6'
// };

// soap.createClient(WSDL_URL, function(err, client) {
//   if (err) {
//     console.error('❌ Error creating SOAP client:', err);
//     return;
//   }

//   // Optional: Set endpoint (if WSDL gives wrong one)
//   // client.setEndpoint('https://fa-esll-saasfademo1.ds-fa.oraclepdemos.com/xmlpserver/services/v2/CatalogService');

//   // Optional: Print available methods for debugging
//   // console.log(client.describe());

//   // Call the uploadObject method
//   client.uploadObject(args, function(err, result, rawResponse, soapHeader, rawRequest) {
//     if (err) {
//       console.error('❌ uploadObject Error:', err.body || err);
//     } else {
//       console.log('✅ uploadObject Result:', result);
//     }

//     // For debugging - log the actual XML sent and received
//     console.log('\n--- RAW REQUEST ---\n', rawRequest);
//     console.log('\n--- RAW RESPONSE ---\n', rawResponse);
//   });
// });


const soap = require('soap');

// Oracle BI Publisher WSDL URL
const WSDL_URL = 'https://fa-esll-saasfademo1.ds-fa.oraclepdemos.com/xmlpserver/services/v2/CatalogService?wsdl';

// Replace with your actual credentials and zipped base64 data
const args = {
  reportObjectAbsolutePathURL: '/~natalie.salesrep/SQLRunner/SQLDataModel',
  objectType: 'xdmz',
  objectZippedData: `encoded data`, // Truncated for readability — use full base64 string
  userID: 'natalie.salesrep',
  password: 'U5t%R#S6'
};

soap.createClient(WSDL_URL, function(err, client) {
  if (err) {
    console.error('❌ Error creating SOAP client:', err);
    return;
  }

  // Call the uploadObject method
  client.uploadObject(args, function(err, result, rawResponse, soapHeader, rawRequest) {
    if (err) {
      const errorBody = err.body || err.toString();
      
      // Check for "already exist" fault string
      if (errorBody.includes('already exist')) {
        console.log('⚠️ Object already exists at the specified path.');
      } else {
        console.error('❌ uploadObject Error:', errorBody);
      }

    } else {
      console.log('✅ Object uploaded successfully!');
      console.log('➡️ Uploaded to:', result.uploadObjectReturn);
    }

    // Debugging logs
    // console.log('\n--- RAW REQUEST ---\n', rawRequest);
    // console.log('\n--- RAW RESPONSE ---\n', rawResponse);
  });
});
