// NATIVA — Backup y restauración de datos

function Backup() {
  const [stats, setStats] = React.useState(null);
  const [lastBackup, setLastBackup] = React.useState(() => localStorage.getItem('nativa_last_backup') || null);
  const [exporting, setExporting] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [importFile, setImportFile] = React.useState(null);
  const [importResult, setImportResult] = React.useState(null);
  const fileRef = React.useRef();

  React.useEffect(() => {
    Promise.all([
      DataService.getClients(true),
      DataService.getOrders(),
      DataService.getProducts(true),
      DataService.getZones(),
      DataService.getInvoices(),
      DataService.getLeads(),
    ]).then(([clients, orders, products, zones, invoices, leads]) => {
      setStats({
        clients: clients.length,
        orders: orders.length,
        products: products.length,
        zones: zones.length,
        invoices: invoices.length,
        leads: leads.length,
      });
    });
  }, []);

  const triggerDownload = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markBackupDone = () => {
    const ts = new Date().toLocaleString('es-AR');
    localStorage.setItem('nativa_last_backup', ts);
    setLastBackup(ts);
  };

  // ─── Export JSON ─────────────────────────────────────────────────────────────
  const exportJSON = async () => {
    setExporting('json');
    try {
      const [clients, orders, zones, products, invoices, leads, cfg] = await Promise.all([
        DataService.getClients(true),
        DataService.getOrders(),
        DataService.getZones(),
        DataService.getProducts(true),
        DataService.getInvoices(),
        DataService.getLeads(),
        DataService.getConfig(),
      ]);
      const data = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        company: cfg.companyName,
        tables: { clients, orders, zones, products, invoices, leads, config: [cfg] },
      };
      triggerDownload(
        JSON.stringify(data, null, 2),
        `nativa-backup-${DataService.today()}.json`,
        'application/json'
      );
      markBackupDone();
    } catch (err) {
      alert('Error al exportar: ' + err.message);
    }
    setExporting('');
  };

  // ─── Export CSV ───────────────────────────────────────────────────────────────
  const toCSV = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
      const s = String(v);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
  };

  const exportCSV = async (table, label) => {
    setExporting(table);
    try {
      let rows = [];
      if (table === 'clients')  rows = await DataService.getClients(true);
      if (table === 'orders')   rows = await DataService.getOrders();
      if (table === 'invoices') rows = await DataService.getInvoices();
      if (table === 'products') rows = await DataService.getProducts(true);
      if (!rows.length) { alert('Sin datos para exportar.'); setExporting(''); return; }
      triggerDownload(
        '﻿' + toCSV(rows),   // BOM for Excel UTF-8
        `nativa-${table}-${DataService.today()}.csv`,
        'text/csv;charset=utf-8;'
      );
    } catch (err) {
      alert('Error al exportar: ' + err.message);
    }
    setExporting('');
  };

  // ─── Import / Restore ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    setImportFile(e.target.files[0] || null);
    setImportResult(null);
  };

  const doImport = async () => {
    if (!importFile) return;
    if (!window.confirm(
      'Esto va a importar los datos del archivo y actualizar los registros existentes (upsert por ID). Los registros no incluidos en el archivo NO se borrarán.\n\n¿Continuar?'
    )) return;

    setImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const tables = data.tables || data;

      const result = { counts: {}, errors: [] };

      // Import order: zones → products → clients → orders → invoices → leads
      const tableOrder = ['zones', 'products', 'clients', 'orders', 'invoices', 'leads'];

      for (const table of tableOrder) {
        const rows = tables[table];
        if (!rows || !rows.length) continue;
        // Convert camelCase JS → snake_case DB
        const dbRows = rows.map(r => DataService._db(r));
        const { error } = await DataService._sb
          .from(table)
          .upsert(dbRows, { onConflict: 'id' });
        if (error) {
          result.errors.push(`${table}: ${error.message}`);
        } else {
          result.counts[table] = rows.length;
        }
      }

      // Config is special (single row, upsert by id=1)
      if (tables.config && tables.config[0]) {
        const dbCfg = { ...DataService._db(tables.config[0]), id: 1 };
        const { error } = await DataService._sb.from('config').upsert(dbCfg);
        if (error) result.errors.push(`config: ${error.message}`);
        else { result.counts['config'] = 1; DataService._configCache = null; }
      }

      setImportResult(result);

      // Refresh stats
      const [clients, orders, products, zones, invoices, leads] = await Promise.all([
        DataService.getClients(true), DataService.getOrders(), DataService.getProducts(true),
        DataService.getZones(), DataService.getInvoices(), DataService.getLeads(),
      ]);
      setStats({ clients: clients.length, orders: orders.length, products: products.length, zones: zones.length, invoices: invoices.length, leads: leads.length });
    } catch (err) {
      setImportResult({ counts: {}, errors: ['Error al leer el archivo: ' + err.message] });
    }
    setImporting(false);
  };

  const TABLE_LABELS = {
    clients: 'Clientes', orders: 'Pedidos', products: 'Productos',
    zones: 'Zonas', invoices: 'Facturas', leads: 'Leads', config: 'Configuración',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Status bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Estado del sistema</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {lastBackup
                ? `Último backup: ${lastBackup}`
                : 'Nunca se hizo un backup. Exportá ahora.'}
            </p>
          </div>
          {!lastBackup && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              <Icon name="alertCircle" size={12}/> Sin backup
            </span>
          )}
          {lastBackup && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <Icon name="checkCircle" size={12}/> Respaldado
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {stats === null
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"/>
                  <div className="h-6 bg-gray-200 rounded w-1/2"/>
                </div>
              ))
            : Object.entries(stats).map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">{TABLE_LABELS[k] || k}</p>
                  <p className="text-xl font-bold text-slate-900">{v}</p>
                </div>
              ))
          }
        </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Exportar</h2>
        <p className="text-sm text-slate-500 mb-4">Descargá los datos en distintos formatos para guardar un respaldo local.</p>

        <div className="space-y-3">
          {/* JSON full backup */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Icon name="download" size={16} className="text-blue-600"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Backup completo (JSON)</p>
                <p className="text-xs text-slate-500 mt-0.5">Todos los datos: clientes, pedidos, facturas, configuración. Usalo para restaurar.</p>
              </div>
            </div>
            <Btn
              onClick={exportJSON}
              disabled={exporting === 'json'}
              variant="primary"
              icon={exporting === 'json' ? 'refresh' : 'download'}
              className="flex-shrink-0 ml-4"
            >
              {exporting === 'json' ? 'Exportando...' : 'Exportar'}
            </Btn>
          </div>

          {/* CSV exports */}
          {[
            { key: 'clients',  label: 'Clientes (CSV)',  sub: 'Nombre, teléfono, dirección, zona, puntos y más.' },
            { key: 'orders',   label: 'Pedidos (CSV)',   sub: 'Historial completo de pedidos con ítems y totales.' },
            { key: 'invoices', label: 'Facturas (CSV)',  sub: 'Registro de pagos y estados de cobranza.' },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="fileText" size={16} className="text-emerald-600"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                </div>
              </div>
              <Btn
                onClick={() => exportCSV(key, label)}
                disabled={!!exporting}
                variant="secondary"
                icon={exporting === key ? 'refresh' : 'download'}
                className="flex-shrink-0 ml-4"
              >
                {exporting === key ? 'Exportando...' : 'CSV'}
              </Btn>
            </div>
          ))}
        </div>
      </div>

      {/* Import / Restore */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Restaurar desde backup</h2>
        <p className="text-sm text-slate-500 mb-4">
          Cargá un archivo <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">.json</code> exportado desde esta app. Los registros existentes con el mismo ID se actualizan (upsert). Los datos no incluidos en el archivo no se borran.
        </p>

        {/* File picker */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Icon name="download" size={28} className="text-gray-300 mx-auto mb-2"/>
          {importFile ? (
            <div>
              <p className="text-sm font-semibold text-slate-900">{importFile.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{(importFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-700">Hacé clic para seleccionar el archivo</p>
              <p className="text-xs text-slate-400 mt-0.5">Solo archivos .json exportados desde NATIVA</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {importFile && (
          <div className="mt-3 flex gap-3">
            <Btn
              onClick={doImport}
              disabled={importing}
              variant="primary"
              icon={importing ? 'refresh' : 'check'}
            >
              {importing ? 'Importando...' : 'Restaurar datos'}
            </Btn>
            <Btn
              onClick={() => { setImportFile(null); setImportResult(null); fileRef.current.value = ''; }}
              variant="secondary"
              icon="x"
            >
              Cancelar
            </Btn>
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div className={`mt-4 rounded-xl p-4 ${importResult.errors.length ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            {importResult.errors.length === 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="checkCircle" size={16} className="text-emerald-600"/>
                  <p className="text-sm font-semibold text-emerald-800">Importación completada</p>
                </div>
                <div className="space-y-1">
                  {Object.entries(importResult.counts).map(([t, c]) => (
                    <p key={t} className="text-xs text-emerald-700">
                      <span className="font-semibold">{TABLE_LABELS[t] || t}</span>: {c} {c === 1 ? 'registro' : 'registros'} importados
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="alertCircle" size={16} className="text-red-600"/>
                  <p className="text-sm font-semibold text-red-800">
                    {Object.keys(importResult.counts).length > 0 ? 'Importación parcial — algunos errores' : 'Error al importar'}
                  </p>
                </div>
                {Object.keys(importResult.counts).length > 0 && (
                  <div className="mb-2 space-y-1">
                    {Object.entries(importResult.counts).map(([t, c]) => (
                      <p key={t} className="text-xs text-emerald-700">
                        <span className="font-semibold">{TABLE_LABELS[t] || t}</span>: {c} registros importados
                      </p>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-700">{e}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Icon name="info" size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div className="text-sm text-amber-800 space-y-1">
            <p className="font-semibold">Buenas prácticas de backup</p>
            <p>Hacé un backup completo (JSON) <strong>antes de cambios importantes</strong> o una vez por semana.</p>
            <p>Guardá el archivo en Google Drive, Dropbox o en tu computadora en una carpeta segura.</p>
            <p>El backup incluye: clientes, pedidos, facturas, zonas, productos y configuración.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
