// CSV export for iqama records
export function exportPersonnelCSV(records) {
  const headers = [
    "Full Name",
    "Phone",
    "Iqama Number",
    "Kafeel Name",
    "Kafeel Phone",
    "CR Number",
    "Muassasa Name",
    "Iqama Expiry Date",
  ];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = (records || []).map((p) =>
    [
      p.name,
      p.phone,
      p.iqamaNumber,
      p.kafeelName,
      p.kafeelPhone,
      p.crNumber,
      p.companyName,
      p.expiryDate,
    ]
      .map(escape)
      .join(",")
  );

  // BOM pehle: Excel mein Urdu/Arabic text theek khulta hai
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `iqama_records_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
