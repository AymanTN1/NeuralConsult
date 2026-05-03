const fs = require('fs');

let c = fs.readFileSync('frontend/src/index.css', 'utf8');

if (!c.includes('.link-btn {')) {
  c += `\n\n.link-btn {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  color: #3b82f6 !important;
  text-decoration: underline !important;
  cursor: pointer;
  font: inherit;
  font-weight: normal !important;
  display: inline;
}
.link-btn:hover {
  color: #1d4ed8 !important;
  text-decoration: underline !important;
}

.light-input-icon {
  padding-left: 2.8rem !important;
}
`;
  fs.writeFileSync('frontend/src/index.css', c);
}

let login = fs.readFileSync('frontend/src/pages/Login.jsx', 'utf8');
login = login.replace(/className="form-control light-input"\s*style=\{\{\s*paddingLeft:\s*"2\.5rem"\s*\}\}/g, 'className="form-control light-input light-input-icon"');
fs.writeFileSync('frontend/src/pages/Login.jsx', login);

