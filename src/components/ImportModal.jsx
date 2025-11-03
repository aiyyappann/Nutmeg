import { useState } from "react";
import { useToast } from "./Toast";
import { X, Upload, Download } from "lucide-react";
import { importCustomers } from "/src/api/customers";

const ImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      previewFile(selectedFile);
    } else {
      addToast("Please select a valid CSV file", "error");
    }
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

      const previewRows = lines
        .slice(1, 6)
        .map((line) => {
          const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || "";
            return obj;
          }, {});
        })
        .filter((row) => Object.values(row).some((val) => val));

      setPreview(previewRows);
    };
    reader.readAsText(file);
  };

const handleImport = async () => {
   if (!file) return;

   setLoading(true);
   const reader = new FileReader();

   reader.onload = async (e) => {
   try {
      const text = e.target.result;
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

      const customers = lines
        .slice(1)
        .map((line) => {
         const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
         return headers.reduce((obj, header, index) => {
         obj[header] = values[index] || "";
         return obj;
         }, {});
        })
        .filter((row) => Object.values(row).some((val) => val));

      const transformed = customers
        .map((customer) => ({
          firstName: customer.Name?.split(" ")[0] || customer["First Name"] || customer.firstName || "",
   // Now checks for template 'Name' OR exported 'lastName'
   lastName:
   customer.Name?.split(" ").slice(1).join(" ") ||
   customer["Last Name"] ||
   customer.lastName ||
   "",
      // Updated all fields to check for both formats
   email: customer.Email || customer.email || "",
   company: customer.Company || customer.company || "",
   industry: customer.Industry || customer.industry || "",
   status: customer.Status || customer.status || "Prospect",
   value: parseFloat(customer.Value || customer.value || 0),
   phone: customer.Phone || customer.phone || "",
  }))
  .filter((c) => c.email && c.email.trim()); 

  if (transformed.length === 0) {
      addToast("No valid customers found in CSV", "error"); // RED toast
      setLoading(false);
      return;
      }

      // call API
      const result = await importCustomers(transformed);
      console.log("Import result:", result);

      // *** THIS IS THE CORRECTED TOAST LOGIC ***

      // Read the counts from the backend response (using the keys from your backend)
      const newCount = result?.inserted || 0;
      const skippedCount = result?.skipped || 0;

      if (newCount > 0) {
         // At least one new customer was inserted. Show a GREEN toast.
         addToast(
            `Successfully imported ${newCount} new customers.`,
            "success" // GREEN
         );
      }

      if (skippedCount > 0) {
         // Duplicates were found. Show a BLUE toast.
         addToast(
            ` ${skippedCount} duplicates were skipped (email already exists).`,
            "info" // BLUE
         );
      }

      if (newCount === 0 && skippedCount === 0) {
         // This can happen if the transformed.length was > 0 but something else went wrong
         addToast("No customers were imported.", "info"); // BLUE/INFO
      }

      // *** END OF CORRECTED LOGIC ***

      onImportComplete();
      handleClose();
     } catch (error) {
      console.error("Error importing customers:", error);
      addToast("Failed to import customers", "error"); // RED toast
     } finally {
      setLoading(false);
     }
   };

   reader.readAsText(file);
  };


  const handleClose = () => {
    setFile(null);
    setPreview([]);
    onClose();
  };

  const downloadTemplate = () => {
    const template =
      'Name,Email,Company,Industry,Status,Value,Phone\n"John Doe",john@company.com,"Tech Corp","Technology","Prospect",50000,"555-0123"';
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer-import-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import Customers</h5>
            <button type="button" className="btn-close" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Upload CSV File</h6>
                <button
                  className="btn btn-outline-primary btn-sm d-flex align-items-center"
                  onClick={downloadTemplate}
                >
                  <Download size={14} className="me-1" />
                  Download Template
                </button>
              </div>
              <input
                type="file"
                className="form-control"
                accept=".csv"
                onChange={handleFileChange}
              />
              <div className="form-text">
                Upload a CSV file with columns: Name, Email, Company, Industry, Status, Value, Phone
              </div>
            </div>

            {preview.length > 0 && (
              <div className="mb-4">
                <h6>Preview ({preview.length} rows shown)</h6>
                <div
                  className="table-responsive"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        {Object.keys(preview[0]).map((header) => (
                          <th key={header} style={{ minWidth: "120px" }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center"
              onClick={handleImport}
              disabled={!file || loading}
            >
              <Upload size={14} className="me-1" />
              {loading ? "Importing..." : "Import Customers"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ImportModal;