import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { SCORE_WEIGHTS } from "@/lib/scoring";

/**
 * A concise, faculty-readable PDF summary — deliberately NOT styled like
 * the app's comic-book UI. Plain black-on-white, standard fonts, meant to
 * be printed or attached to an email, not a screenshot of the dashboard.
 *
 * Shared between the student/leader Reports page and the faculty
 * dashboard: `isFacultyView` + `remarks` together gate the one section
 * (#6) that only makes sense from the faculty side. Every other prop is
 * generic project data — nothing project-specific is hardcoded here.
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#555555",
    marginBottom: 2,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    borderBottom: "1pt solid #cccccc",
    paddingBottom: 3,
  },
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#333333",
  },
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #dddddd",
    paddingVertical: 5,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "1pt solid #999999",
    paddingVertical: 5,
  },
  th: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#444444",
  },
  td: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  colName: { width: "22%" },
  colNum: { width: "11%", textAlign: "right" },
  colScore: { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold" },
  healthGrid: {
    flexDirection: "row",
    gap: 24,
    marginTop: 4,
  },
  healthStat: {
    alignItems: "flex-start",
  },
  healthNumber: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  healthLabel: {
    fontSize: 8.5,
    color: "#666666",
    textTransform: "uppercase",
    marginTop: 2,
  },
  remarkItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: "0.5pt solid #eeeeee",
  },
  remarkMeta: {
    fontSize: 8.5,
    color: "#666666",
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
    borderTop: "0.5pt solid #dddddd",
    paddingTop: 6,
  },
});

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ContributionReportPDF({
  projectName,
  memberNames = [],
  groupId,
  generatedAt = new Date(),
  dateRangeLabel = "All time",
  description,
  members = [],
  teamTotals = { verified: 0, pending: 0, flagged: 0 },
  isFacultyView = false,
  remarks = [],
}) {
  return (
    <Document title={`${projectName} — Contribution Report`}>
      <Page size="A4" style={styles.page}>
        {/* 1. Header */}
        <Text style={styles.title}>{projectName}</Text>
        <Text style={styles.subtitle}>Contribution Report</Text>
        <Text style={styles.subtitle}>
          Team: {memberNames.length > 0 ? memberNames.join(", ") : "—"}
        </Text>
        {groupId && <Text style={styles.subtitle}>Group/Course ID: {groupId}</Text>}
        <Text style={styles.subtitle}>Report generated: {formatDate(generatedAt)}</Text>
        <Text style={styles.subtitle}>Data period: {dateRangeLabel}</Text>

        {/* 2. Project summary (only if a description exists) */}
        {description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Summary</Text>
            <Text style={styles.paragraph}>{description}</Text>
          </View>
        )}

        {/* 3. Contribution table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per-Member Contribution Breakdown</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colName]}>Member</Text>
              <Text style={[styles.th, styles.colNum]}>Hours</Text>
              <Text style={[styles.th, styles.colNum]}>GitHub</Text>
              <Text style={[styles.th, styles.colNum]}>Docs</Text>
              <Text style={[styles.th, styles.colNum]}>Verified</Text>
              <Text style={[styles.th, styles.colNum]}>Pending</Text>
              <Text style={[styles.th, styles.colNum]}>Flagged</Text>
              <Text style={[styles.th, styles.colNum]}>% Hours</Text>
              <Text style={[styles.th, styles.colScore]}>Score</Text>
            </View>
            {members.map((m, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={[styles.td, styles.colName]}>{m.name}</Text>
                <Text style={[styles.td, styles.colNum]}>{m.hours}</Text>
                <Text style={[styles.td, styles.colNum]}>{m.githubCount}</Text>
                <Text style={[styles.td, styles.colNum]}>{m.docsCount}</Text>
                <Text style={[styles.td, styles.colNum]}>{m.verifiedCount}</Text>
                <Text style={[styles.td, styles.colNum]}>{m.pendingCount}</Text>
                <Text style={[styles.td, styles.colNum]}>{m.flaggedCount}</Text>
                <Text style={[styles.td, styles.colNum]}>{m.pctOfHours}%</Text>
                <Text style={[styles.td, styles.colScore]}>{m.score}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Scoring methodology */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How the Score is Calculated</Text>
          <Text style={styles.paragraph}>
            Each contribution earns raw effort points — {SCORE_WEIGHTS.perHour} per logged hour,{" "}
            {SCORE_WEIGHTS.perCommit} per GitHub commit, {SCORE_WEIGHTS.perDoc} per synced document,
            plus {SCORE_WEIGHTS.perHundredWords} point per 100 words of document content — based on
            its own category. That raw value is then multiplied by a verification factor specific to
            that contribution: 1.0 if it has been peer-verified, 0.5 while it is still pending review,
            and 0 if it has been flagged. A member&apos;s final score is the sum of every one of their
            contributions scored this way, so unverified or disputed work always counts for less than
            work the team has actually confirmed.
          </Text>
        </View>

        {/* 5. Verification health summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Health (Team-Wide)</Text>
          <View style={styles.healthGrid}>
            <View style={styles.healthStat}>
              <Text style={styles.healthNumber}>{teamTotals.verified}</Text>
              <Text style={styles.healthLabel}>Verified</Text>
            </View>
            <View style={styles.healthStat}>
              <Text style={styles.healthNumber}>{teamTotals.pending}</Text>
              <Text style={styles.healthLabel}>Pending</Text>
            </View>
            <View style={styles.healthStat}>
              <Text style={styles.healthNumber}>{teamTotals.flagged}</Text>
              <Text style={styles.healthLabel}>Flagged</Text>
            </View>
          </View>
        </View>

        {/* 6. Faculty remarks — faculty-generated reports only */}
        {isFacultyView && remarks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Faculty Remarks</Text>
            {remarks.map((r, i) => (
              <View style={styles.remarkItem} key={i}>
                <Text style={styles.remarkMeta}>
                  On &ldquo;{r.contributionDescription}&rdquo; — {r.facultyName}, {formatDate(r.createdAt)}
                </Text>
                <Text style={styles.paragraph}>{r.remark}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 7. Footer */}
        <Text style={styles.footer}>
          Generated via Contribution Tracker — {formatDate(generatedAt)} {new Date(generatedAt).toLocaleTimeString("en-GB")}
        </Text>
      </Page>
    </Document>
  );
}
