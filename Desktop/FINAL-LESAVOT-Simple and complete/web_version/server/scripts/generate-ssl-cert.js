/**
 * Generate Self-Signed SSL Certificate
 * 
 * This script generates a self-signed SSL certificate for development purposes.
 * DO NOT use self-signed certificates in production.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create SSL directory if it doesn't exist
const sslDir = path.join(__dirname, '../ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Check if OpenSSL is installed
try {
  execSync('openssl version', { stdio: 'ignore' });
} catch (error) {
  console.error('Error: OpenSSL is not installed or not in the PATH.');
  console.error('Please install OpenSSL and try again.');
  process.exit(1);
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default values
const defaults = {
  country: 'US',
  state: 'California',
  locality: 'San Francisco',
  organization: 'LESAVOT',
  organizationalUnit: 'Development',
  commonName: 'localhost',
  email: 'seclesavot@gmail.com',
  days: 365
};

// Prompt for certificate information
console.log('Generating self-signed SSL certificate for development...');
console.log('Press Enter to accept default values.');

rl.question(`Country Name (2 letter code) [${defaults.country}]: `, (country) => {
  country = country || defaults.country;
  
  rl.question(`State or Province Name [${defaults.state}]: `, (state) => {
    state = state || defaults.state;
    
    rl.question(`Locality Name (city) [${defaults.locality}]: `, (locality) => {
      locality = locality || defaults.locality;
      
      rl.question(`Organization Name [${defaults.organization}]: `, (organization) => {
        organization = organization || defaults.organization;
        
        rl.question(`Organizational Unit Name [${defaults.organizationalUnit}]: `, (organizationalUnit) => {
          organizationalUnit = organizationalUnit || defaults.organizationalUnit;
          
          rl.question(`Common Name (e.g. server FQDN or YOUR name) [${defaults.commonName}]: `, (commonName) => {
            commonName = commonName || defaults.commonName;
            
            rl.question(`Email Address [${defaults.email}]: `, (email) => {
              email = email || defaults.email;
              
              rl.question(`Validity (in days) [${defaults.days}]: `, (days) => {
                days = days || defaults.days;
                
                rl.close();
                
                // Generate certificate
                try {
                  console.log('Generating private key...');
                  
                  // Generate private key
                  execSync(`openssl genrsa -out "${path.join(sslDir, 'private-key.pem')}" 2048`);
                  
                  console.log('Generating certificate signing request...');
                  
                  // Generate CSR
                  const csrCommand = `openssl req -new -key "${path.join(sslDir, 'private-key.pem')}" -out "${path.join(sslDir, 'csr.pem')}" -subj "/C=${country}/ST=${state}/L=${locality}/O=${organization}/OU=${organizationalUnit}/CN=${commonName}/emailAddress=${email}"`;
                  execSync(csrCommand);
                  
                  console.log('Generating self-signed certificate...');
                  
                  // Generate certificate
                  const certCommand = `openssl x509 -req -days ${days} -in "${path.join(sslDir, 'csr.pem')}" -signkey "${path.join(sslDir, 'private-key.pem')}" -out "${path.join(sslDir, 'certificate.pem')}"`;
                  execSync(certCommand);
                  
                  // Remove CSR
                  fs.unlinkSync(path.join(sslDir, 'csr.pem'));
                  
                  console.log('Self-signed SSL certificate generated successfully!');
                  console.log(`Private key: ${path.join(sslDir, 'private-key.pem')}`);
                  console.log(`Certificate: ${path.join(sslDir, 'certificate.pem')}`);
                  console.log('\nWARNING: This is a self-signed certificate for development purposes only.');
                  console.log('DO NOT use self-signed certificates in production.');
                } catch (error) {
                  console.error('Error generating SSL certificate:', error.message);
                  process.exit(1);
                }
              });
            });
          });
        });
      });
    });
  });
});
