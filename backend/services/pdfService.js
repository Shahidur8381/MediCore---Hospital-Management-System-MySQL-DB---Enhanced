const React = require('react');
const { Document, Page, Text, View, StyleSheet, renderToStream, Font } = require('@react-pdf/renderer');

// ─── Color Palette ───
const COLORS = {
  primary: '#1a6b3c',      // Deep medical green
  primaryLight: '#2e8b57',  // Sea green
  accent: '#d4af37',        // Gold accent
  dark: '#1a1a2e',          // Near-black
  text: '#2d3436',          // Dark charcoal
  textLight: '#636e72',     // Muted gray
  textMuted: '#95a5a6',     // Light gray
  border: '#dfe6e9',        // Light border
  bgLight: '#f8f9fa',       // Off-white
  white: '#ffffff',
  red: '#c0392b',
  blue: '#2563eb',
};

// ─── Styles ───
const styles = StyleSheet.create({
  page: {
    padding: 0,
    paddingBottom: 95,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },

  // ═══════════════ HEADER ═══════════════
  headerContainer: {
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  // Left: Doctor info
  doctorSection: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.dark,
    marginBottom: 2,
  },
  doctorQualification: {
    fontSize: 9,
    color: COLORS.textLight,
    marginBottom: 1,
  },
  doctorSpecialty: {
    fontSize: 10,
    color: COLORS.primaryLight,
    marginTop: 2,
  },
  doctorDept: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: 1,
  },
  doctorRegNo: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  // Right: Hospital info
  hospitalSection: {
    alignItems: 'flex-end',
  },
  hospitalName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  hospitalTagline: {
    fontSize: 8,
    color: COLORS.textLight,
    marginTop: 1,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  hospitalAddress: {
    fontSize: 8,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 1.5,
  },
  hospitalContact: {
    fontSize: 8,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: 1,
  },

  // ═══════════════ DIVIDER ═══════════════
  headerDivider: {
    height: 2.5,
    backgroundColor: COLORS.primary,
    marginHorizontal: 40,
  },
  headerDividerThin: {
    height: 0.5,
    backgroundColor: COLORS.primary,
    marginHorizontal: 40,
    marginTop: 1.5,
  },

  // ═══════════════ PATIENT INFO ROW ═══════════════
  patientInfoRow: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingTop: 14,
    paddingBottom: 10,
  },
  patientField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  patientFieldLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.dark,
    marginRight: 4,
  },
  patientFieldValue: {
    fontSize: 10,
    color: COLORS.text,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.textMuted,
    paddingBottom: 1,
    flex: 1,
    marginRight: 12,
  },

  // ═══════════════ BODY ═══════════════
  bodyContainer: {
    paddingHorizontal: 40,
    paddingTop: 6,
    flex: 1,
  },

  // Rx Symbol
  rxSymbol: {
    fontSize: 28,
    fontFamily: 'Helvetica-BoldOblique',
    color: COLORS.primary,
    marginBottom: 6,
  },

  // Section Title
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },

  // Diagnosis
  diagnosisBox: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: 10,
    borderRadius: 3,
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 10,
    color: COLORS.dark,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.4,
  },

  // ═══════════════ MEDICATIONS TABLE ═══════════════
  tableContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fafffe',
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.text,
  },
  tableCellBold: {
    fontSize: 9,
    color: COLORS.dark,
    fontFamily: 'Helvetica-Bold',
  },
  // Column widths
  colSl: { width: '5%' },
  colMedicine: { width: '37%' },
  colDosage: { width: '18%' },
  colTiming: { width: '22%' },
  colDuration: { width: '18%' },
  medInstruction: {
    fontSize: 7.5,
    color: COLORS.textLight,
    marginTop: 2,
    fontStyle: 'italic',
  },

  // Simple medicine list (fallback if no table structure)
  medicineItem: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingLeft: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  bulletCol: {
    width: 20,
  },
  bulletText: {
    fontSize: 10,
    color: COLORS.primary,
    fontFamily: 'Helvetica-Bold',
  },
  medicineText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.4,
  },

  // ═══════════════ NOTES ═══════════════
  notesBox: {
    padding: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },

  // ═══════════════ FOOTER ═══════════════
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
  },
  signatureArea: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark,
    paddingTop: 4,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 8,
    color: COLORS.textLight,
  },
  signatureDocName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.dark,
    marginBottom: 1,
  },

  // Bottom strip
  bottomStrip: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 7,
    color: COLORS.textMuted,
    lineHeight: 1.4,
  },
  footerCenter: {
    fontSize: 7,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footerRight: {
    fontSize: 7,
    color: COLORS.textMuted,
    textAlign: 'right',
    lineHeight: 1.4,
  },

  // ═══════════════ SIDE ACCENT ═══════════════
  sideAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
  },
});

// ─── Helper: Parse structured medicine text ───
function parseMedicines(medicinesText) {
  if (!medicinesText) return [];

  const lines = medicinesText.split('\n').map(l => l.trim()).filter(Boolean);
  const medicines = [];

  for (const line of lines) {
    // Strip leading number prefix like "1. ", "2. ", etc.
    const stripped = line.replace(/^\d+\.\s*/, '');

    // Format A: 'Medicine — Dosage/Frequency (Timing) for Duration [Instructions]'
    // e.g. 'Paracetamol 500mg — 1+0+1 (After Meal) for 5 Days [Take for fever or body ache]'
    const formatA = stripped.match(
      /^(.+?)\s*[—–-]\s*(.+?)\s*\((.+?)\)\s*(?:for\s+)?(.+?)(?:\s*\[(.+?)\])?$/i
    );
    if (formatA) {
      medicines.push({
        name: formatA[1].trim(),
        dosage: formatA[2].trim(),
        timing: formatA[3].trim(),
        duration: formatA[4].trim(),
        instructions: formatA[5] ? formatA[5].trim() : '',
        raw: stripped,
      });
      continue;
    }

    // Format B: 'Medicine — Dosage/Frequency (Timing)' without duration
    const formatB = stripped.match(
      /^(.+?)\s*[—–-]\s*(.+?)\s*\((.+?)\)(?:\s*\[(.+?)\])?$/i
    );
    if (formatB) {
      medicines.push({
        name: formatB[1].trim(),
        dosage: formatB[2].trim(),
        timing: formatB[3].trim(),
        duration: '-',
        instructions: formatB[4] ? formatB[4].trim() : '',
        raw: stripped,
      });
      continue;
    }

    // Format C: 'Medicine (Frequency)' e.g. 'Amlodipine 5mg (1-0-0)' or 'Fexofenadine 120mg (1-0-1)'
    const formatC = stripped.match(/^(.+?)\s*\(([0-9+-\/]+(?:\s*[a-zA-Z\s]+)?)\)$/i);
    if (formatC) {
      medicines.push({
        name: formatC[1].trim(),
        dosage: formatC[2].trim(),
        timing: 'As directed',
        duration: '-',
        instructions: '',
        raw: stripped,
      });
      continue;
    }

    // Format D: Pipe separated e.g. 'Medicine | Dosage | Timing | Duration | Instructions'
    const parts = stripped.split(/\s*[|]\s*/);
    if (parts.length >= 3) {
      medicines.push({
        name: parts[0] || '',
        dosage: parts[1] || '-',
        timing: parts[2] || '-',
        duration: parts[3] || '-',
        instructions: parts[4] || '',
        raw: stripped,
      });
      continue;
    }

    // Fallback: plain text
    medicines.push({
      name: stripped,
      dosage: '-',
      timing: '-',
      duration: '-',
      instructions: '',
      raw: stripped,
    });
  }
  return medicines;
}


// ─── Helper: Calculate age ───
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 'N/A';
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return `${age} yrs`;
}

/**
 * React PDF Document Component — Professional Medical Prescription
 */
const PrescriptionDocument = ({ prescription, doctor, patient }) => {
  const formattedDate = prescription.PRESCRIPTION_DATE
    ? new Date(prescription.PRESCRIPTION_DATE).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const medicines = parseMedicines(prescription.MEDICINES);
  const hasStructuredMeds = medicines.some(m => m.dosage !== '-' || m.timing !== '-' || m.duration !== '-');
  const patientAge = calculateAge(patient?.DATE_OF_BIRTH);
  const patientGender = patient?.GENDER || 'N/A';
  const patientName = patient?.NAME || prescription?.PATIENT_NAME || 'N/A';
  const doctorName = doctor?.NAME || prescription?.DOCTOR_NAME || 'Specialist';
  const doctorQualification = doctor?.QUALIFICATION || 'MBBS';
  const doctorSpecialization = doctor?.SPECIALIZATION || 'General Physician';
  const departmentName = doctor?.DEPARTMENT_NAME || 'Clinical Medicine';

  return React.createElement(
    Document,
    { title: `MediCore Prescription #${prescription.PRESCRIPTION_ID}`, author: 'MediCore Hospital' },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // ═══ Side Accent Bar ═══
      React.createElement(View, { style: styles.sideAccent }),

      // ═══ HEADER ═══
      React.createElement(
        View,
        { style: styles.headerContainer },
        React.createElement(
          View,
          { style: styles.headerRow },

          // Left: Doctor Information
          React.createElement(
            View,
            { style: styles.doctorSection },
            React.createElement(Text, { style: styles.doctorName }, `Dr. ${doctorName}`),
            React.createElement(Text, { style: styles.doctorQualification }, doctorQualification),
            React.createElement(Text, { style: styles.doctorSpecialty }, `Specialist in ${doctorSpecialization}`),
            React.createElement(Text, { style: styles.doctorDept }, `Department of ${departmentName}`),
            React.createElement(Text, { style: styles.doctorRegNo }, `Doctor ID: #${prescription.DOCTOR_ID}`)
          ),

          // Right: Hospital Information
          React.createElement(
            View,
            { style: styles.hospitalSection },
            React.createElement(Text, { style: styles.hospitalName }, 'MediCore'),
            React.createElement(Text, { style: styles.hospitalTagline }, 'ADVANCED CLINICAL HOSPITAL MANAGEMENT'),
            React.createElement(Text, { style: styles.hospitalAddress }, 'Road 11, Medical District\nDhaka 1212, Bangladesh'),
            React.createElement(Text, { style: styles.hospitalContact }, 'Phone: +880 9600-000000'),
            React.createElement(Text, { style: styles.hospitalContact }, 'Email: hello@shahidur.dev')
          )
        )
      ),

      // ═══ GREEN DIVIDER ═══
      React.createElement(View, { style: styles.headerDivider }),
      React.createElement(View, { style: styles.headerDividerThin }),

      // ═══ PATIENT INFO ROW ═══
      React.createElement(
        View,
        { style: styles.patientInfoRow },
        // Name
        React.createElement(
          View,
          { style: { ...styles.patientField, flex: 1.8 } },
          React.createElement(Text, { style: styles.patientFieldLabel }, 'Name:'),
          React.createElement(Text, { style: styles.patientFieldValue }, patientName)
        ),
        // Age
        React.createElement(
          View,
          { style: { ...styles.patientField, flex: 0.8 } },
          React.createElement(Text, { style: styles.patientFieldLabel }, 'Age:'),
          React.createElement(Text, { style: styles.patientFieldValue }, patientAge)
        ),
        // Gender
        React.createElement(
          View,
          { style: { ...styles.patientField, flex: 0.9 } },
          React.createElement(Text, { style: styles.patientFieldLabel }, 'Gender:'),
          React.createElement(Text, { style: styles.patientFieldValue }, patientGender)
        ),
        // Date
        React.createElement(
          View,
          { style: { ...styles.patientField, flex: 1.5 } },
          React.createElement(Text, { style: styles.patientFieldLabel }, 'Date:'),
          React.createElement(Text, { style: styles.patientFieldValue }, formattedDate)
        )
      ),

      // ═══ BODY ═══
      React.createElement(
        View,
        { style: styles.bodyContainer },

        // Rx Symbol
        React.createElement(Text, { style: styles.rxSymbol }, 'Rx'),

        // Diagnosis Section
        React.createElement(Text, { style: styles.sectionTitle }, 'Clinical Diagnosis'),
        React.createElement(
          View,
          { style: styles.diagnosisBox },
          React.createElement(Text, { style: styles.diagnosisText }, prescription.DIAGNOSIS || 'General Clinical Review')
        ),

        // Medications Section
        React.createElement(Text, { style: styles.sectionTitle }, 'Prescribed Medications'),

        hasStructuredMeds
          ? // Render as a table
            React.createElement(
              View,
              { style: styles.tableContainer },
              // Table Header
              React.createElement(
                View,
                { style: styles.tableHeader },
                React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colSl } }, '#'),
                React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colMedicine } }, 'Medicine'),
                React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colDosage } }, 'Dose / Freq'),
                React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colTiming } }, 'Timing'),
                React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colDuration } }, 'Duration')
              ),
              // Table Rows
              ...medicines.map((med, idx) =>
                React.createElement(
                  View,
                  { key: idx, style: idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow },
                  React.createElement(Text, { style: { ...styles.tableCell, ...styles.colSl } }, `${idx + 1}`),
                  React.createElement(
                    View,
                    { style: styles.colMedicine },
                    React.createElement(Text, { style: styles.tableCellBold }, med.name),
                    med.instructions ? React.createElement(Text, { style: styles.medInstruction }, med.instructions) : null
                  ),
                  React.createElement(Text, { style: { ...styles.tableCell, ...styles.colDosage } }, med.dosage || '-'),
                  React.createElement(Text, { style: { ...styles.tableCell, ...styles.colTiming } }, med.timing || '-'),
                  React.createElement(Text, { style: { ...styles.tableCell, ...styles.colDuration } }, med.duration || '-')
                )
              )
            )
          : // Render as a simple list
            React.createElement(
              View,
              { style: styles.tableContainer },
              medicines.length > 0
                ? medicines.map((med, idx) =>
                    React.createElement(
                      View,
                      { key: idx, style: styles.medicineItem },
                      React.createElement(
                        View,
                        { style: styles.bulletCol },
                        React.createElement(Text, { style: styles.bulletText }, `${idx + 1}.`)
                      ),
                      React.createElement(Text, { style: styles.medicineText }, med.raw)
                    )
                  )
                : React.createElement(Text, { style: styles.medicineText }, 'No specific medications prescribed.')
            ),

        // Doctor Notes & Instructions
        prescription.NOTES
          ? React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.sectionTitle }, 'Doctor\'s Advice & Instructions'),
              React.createElement(
                View,
                { style: styles.notesBox },
                React.createElement(Text, { style: styles.notesText }, prescription.NOTES)
              )
            )
          : null
      ),

      // ═══ FOOTER ═══
      React.createElement(
        View,
        { style: styles.footerContainer },

        // Signature
        React.createElement(
          View,
          { style: styles.signatureArea },
          React.createElement(
            View,
            { style: styles.signatureLine },
            React.createElement(Text, { style: styles.signatureDocName }, `Dr. ${doctorName}`),
            React.createElement(Text, { style: styles.signatureLabel }, doctorSpecialization),
            React.createElement(Text, { style: styles.signatureLabel }, 'Authorized Medical Practitioner')
          )
        ),

        // Bottom info strip
        React.createElement(
          View,
          { style: styles.bottomStrip },
          React.createElement(
            Text,
            { style: styles.footerLeft },
            `Prescription #${prescription.PRESCRIPTION_ID}\nAppointment #${prescription.APPOINTMENT_ID}`
          ),
          React.createElement(
            Text,
            { style: styles.footerCenter },
            'This is a digitally generated prescription by MediCore HMS.\nVerified and authorized by the prescribing physician.'
          ),
          React.createElement(
            Text,
            { style: styles.footerRight },
            `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}\nhello@shahidur.dev`
          )
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
    appointment,
  });

  return await renderToStream(element);
}

module.exports = {
  generatePrescriptionPdfStream,
};
