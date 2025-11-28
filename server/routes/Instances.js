require('dotenv').config();
const express = require("express");
const soap = require("soap");
const router = express.Router();
const Instance = require("../model/Instance");
const auth = require("../middleware/auth"); // Middleware to verify token

// SQL Runner Route: Run SQL Query via SOAP


// Existing Route: Add a new instance
router.post("/", auth, async (req, res) => {
    const { name, instanceUrl, username, password, description } = req.body;

    // Fusion BI Publisher SOAP WSDL
    const WSDL_URL = `${instanceUrl}/xmlpserver/services/v2/CatalogService?wsdl`;

    // Prepare args for the first object (SQL Data Model)
    const args = {
        reportObjectAbsolutePathURL: `/Custom/SQLRunner/SQLDataModel`,
        objectType: 'xdmz',
        objectZippedData: process.env.ObjectZippedData,
        userID: `${username}`,
        password: password
    };

    // Prepare args for the second object (SQL Report)
    const args1 = {
        reportObjectAbsolutePathURL: `/Custom/SQLRunner/SQLReport`,
        objectType: 'xdoz',
        objectZippedData: process.env.ReportZippedData,
        userID: `${username}`,
        password: password
    };

    try {
        // Create SOAP client and call uploadObject method for both objects in parallel
        soap.createClient(WSDL_URL, async function (err, client) {
            if (err) {
                console.error('❌ Error creating SOAP client:', err);
                return res.status(500).json({ message: 'Failed to connect to Fusion instance', error: err });
            }

            // Function to handle uploading of an object
            const uploadObject = (args) => {
                return new Promise((resolve, reject) => {
                    client.uploadObject(args, (err, result) => {
                        if (err) {
                            // 1. Capture the error body or string representation
                            const errorBody = err?.body || err?.toString();

                            // 2. Check for the "already exist!" fault string in the error body.
                            if (errorBody && errorBody.includes("already exist!")) {
                                // If the object already exists, treat this as a success and resolve.
                                // We resolve with the *arguments* as a placeholder result since the API failed.
                                resolve({ status: "Warning", message: "Object already existed, proceeding." });
                            } else {
                                // For any other type of error (connection, authentication, etc.), reject the promise.
                                reject(errorBody);
                            }
                        } else {
                            // Successful upload
                            resolve(result);
                        }
                    });
                });
            };

            try {
                // Upload both objects in parallel using Promise.all
                const results = await Promise.all([
                    uploadObject(args),
                    uploadObject(args1)
                ]);

                // If successful for both objects (or they already existed), save instance details to DB
                const newInstance = new Instance({
                    userId: req.user._id,
                    name,
                    instanceUrl,
                    username,
                    password,
                    description,
                });

                await newInstance.save();

                return res.status(201).json({
                    message: "Both objects uploaded and instance added successfully!",
                    instance: newInstance,
                    results: results // Return results of both upload attempts
                });
            } catch (uploadError) {
                console.error("❌ uploadObject failed:", uploadError);
                return res.status(400).json({ message: "Fusion upload failed", error: uploadError });
            }
        });
    } catch (outerError) {
        console.error("❌ Unexpected error:", outerError);
        return res.status(500).json({ message: "Unexpected error", error: outerError });
    }
});

// 🧩 Get all instances for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const instances = await Instance.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ instances });
  } catch (error) {
    res.status(500).json({ message: "Error fetching instances", error });
  }
});

// 🔍 Get a single instance by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const instance = await Instance.findOne({ _id: req.params.id, userId: req.user._id });
    if (!instance) return res.status(404).json({ message: "Instance not found" });
    res.status(200).json({ instance });
  } catch (error) {
    res.status(500).json({ message: "Error fetching instance", error });
  }
});

// ❌ Delete an instance
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Instance.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!deleted) return res.status(404).json({ message: "Instance not found" });
    res.status(200).json({ message: "Instance deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting instance", error });
  }
});
router.post("/sqlrunner/run", auth, async (req, res) => {
  const { encodedQuery, instanceDetails } = req.body;
  const { instanceUrl, username, password } = instanceDetails;
console.log(encodedQuery)
  // Decode the base64-encoded SQL query
  const decodedQuery = Buffer.from(encodedQuery, 'base64').toString('utf-8');

  const WSDL_URL = `${instanceUrl}/xmlpserver/services/v2/ReportService?wsdl`;

  // Request Data for SOAP call
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
      reportAbsolutePath: `/Custom/SQLRunner/SQLReport.xdo`,
      sizeOfDataChunkDownload: -1
    },
    userID: username,
    password: password
  };

  // Create SOAP client and make the request
  try {
    soap.createClient(WSDL_URL, (err, client) => {
      if (err) {
        console.error('❌ Error creating SOAP client:', err);
        return res.status(500).json({ error: 'Error creating SOAP client' });
      }

      // Call the 'runReport' method for executing the SQL query
      client.runReport(args, (err, result) => {
        console.log(result);
        if (err) {
          console.error('❌ runReport Error:', err.body || err);
          return res.status(500).json({ error: 'Error running data model' });
        }
          console.log(result)
        // Extract the base64 encoded reportBytes from the response
        const reportBytes = result.runReportReturn.reportBytes;

        // Decode the base64 reportBytes to XML
        const decodedXML = Buffer.from(reportBytes, 'base64').toString('utf-8');

        // Convert XML to JSON using xml2js
        const parser = new require('xml2js').Parser({ explicitArray: false });
        parser.parseString(decodedXML, (err, jsonResult) => {
          if (err) {
            console.error('❌ Error parsing XML to JSON:', err);
            return res.status(500).json({ error: 'Error parsing XML to JSON' });
          }

          // Return the parsed result as JSON
          return res.json({ result: jsonResult });
        });
      });
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

module.exports = router;
