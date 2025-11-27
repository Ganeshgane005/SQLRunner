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

  // Prepare args for uploadObject
  const args = {
    reportObjectAbsolutePathURL: `/~${username}/SQLRunner/SQLDataModel`,
    objectType: 'xdmz',
    objectZippedData: process.env.ObjectZippedData, 
    userID: `${username}`,
    password: password
  };

  try {
    // Create SOAP client and call uploadObject method
    soap.createClient(WSDL_URL, async function (err, client) {
      if (err) {
        console.error('❌ Error creating SOAP client:', err);
        return res.status(500).json({ message: 'Failed to connect to Fusion instance', error: err });
      }

      client.uploadObject(args, async function (err, result) {
        const errorBody = err?.body || err?.toString();

        // If success or already exists
        if (!err || errorBody.includes('already exist')) {
          try {
            // Save instance details to DB
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
              message: "Instance added successfully!",
              instance: newInstance
            });
          } catch (dbError) {
            console.error("❌ DB Save Error:", dbError);
            return res.status(500).json({ message: "Error saving instance", error: dbError });
          }
        } else {
          console.error("❌ uploadObject failed:", errorBody);
          return res.status(400).json({ message: "Fusion upload failed", error: errorBody });
        }
      });
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
      reportAbsolutePath: `/~${username}/SQLRunner/SQLDataModel.xdm`,
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

      // Call the 'runDataModel' method for executing the SQL query
      client.runDataModel(args, (err, result) => {
        if (err) {
          console.error('❌ runDataModel Error:', err.body || err);
          return res.status(500).json({ error: 'Error running data model' });
        }

        // Extract the base64 encoded reportBytes from the response
        const reportBytes = result.runDataModelReturn.reportBytes;

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
