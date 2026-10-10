import { getDB, saveDB } from './mockData';

// Helper to simulate network latency
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const api = {
  get: async (url, config = {}) => {
    await delay(300 + Math.random() * 300); // 300-600ms latency
    const db = getDB();

    if (url === '/api/dashboard/stats') {
      const tenders = db.tenders;
      return {
        data: {
          total_bids: tenders.length,
          in_progress: tenders.filter(t => t.status === 'in_progress' || t.status === 'draft').length,
          submitted: tenders.filter(t => t.status === 'submitted').length,
          won: tenders.filter(t => t.status === 'won').length,
          avg_compliance_score: 85,
          high_risk_bids: tenders.filter(t => t.risk_level === 'high' || t.risk_level === 'critical').length,
          recent_activity: db.audit.slice(0, 5)
        }
      };
    }

    if (url === '/api/tenders') {
      return { data: db.tenders };
    }

    if (url.match(/^\/api\/tenders\/\d+$/)) {
      const id = parseInt(url.split('/')[3]);
      const tender = db.tenders.find(t => t.id === id);
      if (tender) return { data: tender };
      throw { response: { status: 404, data: { detail: "Tender not found" } } };
    }

    if (url.match(/^\/api\/tenders\/\d+\/bidder$/)) {
      return { data: db.bidder };
    }

    if (url.match(/^\/api\/tenders\/\d+\/compliance$/)) {
      const id = parseInt(url.split('/')[3]);
      return { data: db.compliance[id] || db.compliance[1] };
    }

    if (url.match(/^\/api\/tenders\/\d+\/verify$/)) {
      const id = parseInt(url.split('/')[3]);
      return { data: db.verifications[id] || db.verifications[1] };
    }

    if (url.match(/^\/api\/tenders\/\d+\/risk$/)) {
      const id = parseInt(url.split('/')[3]);
      return { data: db.risk[id] || db.risk[1] };
    }

    if (url.match(/^\/api\/tenders\/\d+\/audit$/)) {
      const id = parseInt(url.split('/')[3]);
      return { data: db.audit.filter(a => a.tender_id === id) };
    }

    if (url === '/api/reports') {
      return { data: db.reports };
    }

    if (url.match(/^\/api\/reports\/\d+\/download$/)) {
      // Return a fake blob
      return { data: new Blob(["Fake PDF Content"], { type: 'application/pdf' }) };
    }

    if (url === '/api/audit-trail') {
      return { data: db.audit };
    }

    console.warn(`Mock API GET ${url} not implemented`);
    return { data: {} };
  },

  post: async (url, data, config = {}) => {
    await delay(500 + Math.random() * 400); // 500-900ms latency
    const db = getDB();

    if (url === '/api/auth/login') {
      // Mock login validation
      if (data.email === 'vendor@complyai.demo' && data.password === 'demo123') {
        return {
          data: {
            access_token: 'mock-jwt-token-12345',
            user: {
              id: 1,
              email: 'vendor@complyai.demo',
              full_name: 'Surya K',
              organization: 'ABC Technologies Pvt. Ltd.',
              role: 'vendor'
            }
          }
        };
      }
      throw { response: { status: 401, data: { detail: 'Invalid credentials. Use vendor@complyai.demo / demo123' } } };
    }

    if (url === '/api/tenders/upload') {
      // Simulate file upload and creating a tender record
      const fileName = data.get('file').name;
      const newTender = {
        id: Date.now(),
        gem_tender_id: `GEM/2024/B/${Math.floor(1000000 + Math.random() * 9000000)}`,
        title: `Tender for ${fileName}`,
        department: "Ministry of Education",
        status: "draft",
        analysis_status: "pending",
        created_at: new Date().toISOString()
      };
      db.tenders.unshift(newTender);
      db.audit.unshift({
        id: Date.now() + 1,
        tender_id: newTender.id,
        gem_tender_id: newTender.gem_tender_id,
        tender_name: newTender.title,
        event_type: "document_uploaded",
        event_description: `Tender document uploaded: ${fileName}`,
        status: "success",
        created_at: new Date().toISOString()
      });
      saveDB(db);
      return { data: { tender_id: newTender.id, filename: fileName, message: "Uploaded successfully" } };
    }

    if (url.match(/^\/api\/tenders\/\d+\/analyze$/)) {
      const id = parseInt(url.split('/')[3]);
      const tender = db.tenders.find(t => t.id === id);
      if (tender) {
        tender.analysis_status = "completed";
        tender.compliance_score = 78.0;
        tender.risk_score = 18.0;
        tender.risk_level = "low";
        db.compliance[id] = db.compliance[1]; // copy mock data
        db.verifications[id] = db.verifications[1];
        db.risk[id] = db.risk[1];
        db.audit.unshift({
          id: Date.now(), tender_id: id, gem_tender_id: tender.gem_tender_id,
          event_type: "analysis_completed", event_description: "AI analysis completed",
          status: "success", created_at: new Date().toISOString()
        });
        saveDB(db);
        return { data: { message: "Analysis complete" } };
      }
    }

    if (url.match(/^\/api\/tenders\/\d+\/verify$/)) {
      const id = parseInt(url.split('/')[3]);
      const tender = db.tenders.find(t => t.id === id);
      db.audit.unshift({
        id: Date.now(), tender_id: id, gem_tender_id: tender?.gem_tender_id,
        event_type: "verification_completed", event_description: "Re-verification completed",
        status: "success", created_at: new Date().toISOString()
      });
      saveDB(db);
      return { data: { message: "Verified" } };
    }

    if (url.match(/^\/api\/reports\/\d+\/generate$/)) {
      const id = parseInt(url.split('/')[3]);
      const tender = db.tenders.find(t => t.id === id);
      const reportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      db.reports.unshift({
        id: Date.now(),
        report_id: reportId,
        tender_id: id,
        gem_tender_id: tender?.gem_tender_id,
        tender_title: tender?.title,
        compliance_score: tender?.compliance_score,
        risk_level: tender?.risk_level,
        generated_at: new Date().toISOString()
      });
      db.audit.unshift({
        id: Date.now() + 1, tender_id: id, gem_tender_id: tender?.gem_tender_id,
        event_type: "report_generated", event_description: `Report ${reportId} generated`,
        status: "success", created_at: new Date().toISOString()
      });
      saveDB(db);
      return { data: { report_id: reportId, message: "Report generated" } };
    }

    if (url.match(/^\/api\/tenders\/\d+\/documents$/)) {
      const id = parseInt(url.split('/')[3]);
      const reqId = parseInt(data.get('requirement_id'));
      const tender = db.tenders.find(t => t.id === id);
      if (tender && db.compliance[id]) {
        const result = db.compliance[id].results.find(r => r.requirement_id === reqId);
        if (result) {
          result.status = "compliant";
          result.document_found = data.get('file').name;
          result.remarks = "Uploaded via portal";
          db.compliance[id].missing -= 1;
          db.compliance[id].compliant += 1;
          db.compliance[id].compliance_score = Math.min(100, db.compliance[id].compliance_score + 10);
          tender.compliance_score = db.compliance[id].compliance_score;
          saveDB(db);
          return { data: { message: "Uploaded", new_compliance_score: db.compliance[id].compliance_score } };
        }
      }
    }

    console.warn(`Mock API POST ${url} not implemented`);
    return { data: {} };
  }
};

export default api;
