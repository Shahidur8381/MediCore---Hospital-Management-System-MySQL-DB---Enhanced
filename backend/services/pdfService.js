const React = require('react');
const { Document, Page, Text, View, StyleSheet, renderToStream } = require('@react-pdf/renderer');

// Clean, professional medical letterhead styles
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
    backgroundColor: '#ffffff'
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
    paddingBottom: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    letterSpacing: 0.5
  },
  brandSubtitle: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2
  },
  hospitalInfo: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'right',
    lineHeight: 1.4
  },
  metaSection: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16
  },
  metaColumn: {
    flex: 1
  },
  doctorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  doctorDetail: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2
  },
  patientTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  patientDetail: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2
  },
  rxSymbol: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold'
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
    marginBottom: 6,
    marginTop: 10
  },
  diagnosisBox: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    padding: 8,
    marginBottom: 12,
    borderRadius: 3
  },
  diagnosisText: {
    fontSize: 10,
    color: '#1e3a8a',
    fontWeight: 'bold'
  },
  medicinesList: {
    marginBottom: 12
  },
  medicineItem: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9'
  },
  bulletPoint: {
    width: 14,
    fontSize: 10,
    color: '#2563eb',
    fontWeight: 'bold'
  },
  medicineContent: {
    flex: 1
  },
  medicineName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  medicineDirective: {
    fontSize: 9,
    color: '#475569',
    marginTop: 1
  },
  notesBox: {
    padding: 8,
    backgroundColor: '#fdfbf7',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 4,
    marginBottom: 20
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.4
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  footerNote: {
    fontSize: 8,
    color: '#94a3b8'
  },
  signatureBox: {
    width: 140,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    textAlign: 'center',
    paddingTop: 4
  },
  signatureText: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'center'
  }
});

/**
 * React PDF Document Component
 */
const PrescriptionDocument = ({ prescription, doctor, patient, appointment }) => {
  const formattedDate = prescription.PRESCRIPTION_DATE
    ? new Date(prescription.PRESCRIPTION_DATE).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Parse lines of medicines
  const medicineLines = (prescription.MEDICINES || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.brandTitle }, 'MediCore'),
          React.createElement(Text, { style: styles.brandSubtitle }, 'Advanced Clinical Hospital Management System')
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.hospitalInfo }, 'MediCore Central Hospital'),
          React.createElement(Text, { style: styles.hospitalInfo }, 'Road 11, Medical District, Dhaka 1212'),
          React.createElement(Text, { style: styles.hospitalInfo }, 'Hotline: +880 9600-000000 | info@medicore.com')
        )
      ),

      // Doctor & Patient Meta Section
      React.createElement(
        View,
        { style: styles.metaSection },
        // Doctor details
        React.createElement(
          View,
          { style: styles.metaColumn },
          React.createElement(Text, { style: styles.doctorName }, `Dr. ${doctor?.NAME || prescription?.DOCTOR_NAME || 'Specialist'}`),
          React.createElement(Text, { style: styles.doctorDetail }, doctor?.QUALIFICATION || 'MBBS, FCPS'),
          React.createElement(Text, { style: styles.doctorDetail }, doctor?.SPECIALIZATION || 'General Physician'),
          React.createElement(Text, { style: styles.doctorDetail }, `Dept: ${doctor?.DEPARTMENT_NAME || 'Clinical Medicine'}`)
        ),
        // Patient details
        React.createElement(
          View,
          { style: styles.metaColumn },
          React.createElement(Text, { style: styles.patientTitle }, 'Patient Information'),
          React.createElement(Text, { style: styles.patientDetail }, `Name: ${patient?.NAME || prescription?.PATIENT_NAME || 'N/A'}`),
          React.createElement(Text, { style: styles.patientDetail }, `Gender: ${patient?.GENDER || 'N/A'} | Blood: ${patient?.BLOOD_GROUP || 'N/A'}`),
          React.createElement(Text, { style: styles.patientDetail }, `Phone: ${patient?.PHONE || 'N/A'}`),
          React.createElement(Text, { style: styles.patientDetail }, `Prescription Date: ${formattedDate}`)
        )
      ),

      // Rx Symbol
      React.createElement(Text, { style: styles.rxSymbol }, 'Rx'),

      // Diagnosis Section
      React.createElement(Text, { style: styles.sectionTitle }, 'Clinical Diagnosis'),
      React.createElement(
        View,
        { style: styles.diagnosisBox },
        React.createElement(Text, { style: styles.diagnosisText }, prescription.DIAGNOSIS || 'General Clinical Review')
      ),

      // Prescribed Medicines Section
      React.createElement(Text, { style: styles.sectionTitle }, 'Medications & Dosage Directives'),
      React.createElement(
        View,
        { style: styles.medicinesList },
        medicineLines.length > 0
          ? medicineLines.map((med, idx) =>
              React.createElement(
                View,
                { key: idx, style: styles.medicineItem },
                React.createElement(Text, { style: styles.bulletPoint }, `${idx + 1}.`),
                React.createElement(
                  View,
                  { style: styles.medicineContent },
                  React.createElement(Text, { style: styles.medicineName }, med)
                )
              )
            )
          : React.createElement(Text, { style: styles.medicineDirective }, 'No specific pharmaceutical medications recorded.')
      ),

      // Doctor Notes & Instructions
      prescription.NOTES
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, 'Doctor Advice & Instructions'),
            React.createElement(
              View,
              { style: styles.notesBox },
              React.createElement(Text, { style: styles.notesText }, prescription.NOTES)
            )
          )
        : null,

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.footerNote }, `Prescription ID: #${prescription.PRESCRIPTION_ID} | Appointment: #${prescription.APPOINTMENT_ID}`),
          React.createElement(Text, { style: styles.footerNote }, 'This digital prescription is verified by MediCore Clinical Protocol.')
        ),
        React.createElement(
          View,
          { style: styles.signatureBox },
          React.createElement(Text, { style: styles.signatureText }, `Dr. ${doctor?.NAME || prescription?.DOCTOR_NAME || ''}`),
          React.createElement(Text, { style: styles.signatureText }, 'Authorized Medical Practitioner')
        )
      )
    )
  );
};

/**
 * Generate a PDF stream from prescription data
 */
async function generatePrescriptionPdfStream({ prescription, doctor, patient, appointment }) {
  const element = React.createElement(PrescriptionDocument, {
    prescription,
    doctor,
    patient,
    appointment
  });

  return await renderToStream(element);
}

module.exports = {
  generatePrescriptionPdfStream
};
