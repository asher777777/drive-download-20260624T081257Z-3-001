/**
 * Server-Side JSON Template Library for Smart Office Generative Visual Canvas
 * Expanded with Chart Graphs, Excel Tables, iFrame Embedded Views & object-contain image cards.
 */

export interface VectorShape {
  type: 'badge' | 'circle' | 'rhombus' | 'sparkle' | 'shield' | 'star' | 'chart' | 'table';
  color: string;
  iconName?: string;
  label?: string;
}

export interface JSONTemplateComponent {
  templateId: string;
  type: 
    | 'text_image_page_vector'
    | 'text_vector_shape'
    | 'text_image_page_vector_alt'
    | 'page_link_card'
    | 'text_video_page_vector'
    | 'text_video_link'
    | 'chart_graph_card'
    | 'excel_table_card'
    | 'iframe_view_card';
  data: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    pageUrl?: string;
    pageTitle?: string;
    iframeUrl?: string;
    iframeTitle?: string;
    vectorShape?: VectorShape;
    badge?: string;
    extraLinks?: Array<{ title: string; url: string }>;
    metrics?: Record<string, any>;
    chartData?: {
      title: string;
      labels: string[];
      values: number[];
      type?: 'bar' | 'line';
    };
    tableData?: {
      title: string;
      headers: string[];
      rows: Array<Record<string, any>>;
    };
  };
}

export const JSON_TEMPLATE_LIBRARY: Record<string, (data: any) => JSONTemplateComponent> = {
  // 1. Text + Link to Image + Link to Page + Vector Shape (Image Contained!)
  text_image_page_vector: (data: any) => ({
    templateId: 'tpl_1_text_image_page_vector',
    type: 'text_image_page_vector',
    data: {
      text: data.text || 'Database Intelligence Scan Completed',
      imageUrl: data.imageUrl || data.image || '/edoffice/ed.webp',
      pageUrl: data.pageUrl || data.url || '/office/david',
      pageTitle: data.pageTitle || 'View Page Audit',
      vectorShape: data.vectorShape || { type: 'shield', color: '#FFC800', label: 'Verified DB' },
      badge: data.badge || 'Live Sync',
      metrics: data.metrics || {}
    }
  }),

  // 2. Text + Vector Shape Link / Badge
  text_vector_shape: (data: any) => ({
    templateId: 'tpl_2_text_vector_shape',
    type: 'text_vector_shape',
    data: {
      text: data.text || 'Security & Role Authorization Status Optimal',
      vectorShape: data.vectorShape || { type: 'rhombus', color: '#FFC800', label: 'Security L1' },
      badge: data.badge || 'Authorized Scope',
      metrics: data.metrics || {}
    }
  }),

  // 3. Text + Link to Image + Link to Page + Vector Shape (Alternative Layout - Contained Image)
  text_image_page_vector_alt: (data: any) => ({
    templateId: 'tpl_3_text_image_page_vector_alt',
    type: 'text_image_page_vector_alt',
    data: {
      text: data.text || 'Executive Multi-Collection Database Audit',
      imageUrl: data.imageUrl || '/edoffice/ed.webp',
      pageUrl: data.pageUrl || '/office/david',
      pageTitle: data.pageTitle || 'Open Executive Dashboard',
      vectorShape: data.vectorShape || { type: 'sparkle', color: '#FFC800', label: 'Analytics' },
      badge: data.badge || 'Audit Passed',
      extraLinks: data.extraLinks || []
    }
  }),

  // 4. Link to Page Card
  page_link_card: (data: any) => ({
    templateId: 'tpl_4_page_link_card',
    type: 'page_link_card',
    data: {
      text: data.text || 'Direct Access to Landing Hub & Pages',
      pageUrl: data.pageUrl || '/office/david',
      pageTitle: data.pageTitle || 'Launch Digital Office Page',
      vectorShape: data.vectorShape || { type: 'star', color: '#FFC800', label: 'Featured Page' }
    }
  }),

  // 5. Text + Video Link + Link to Page + Vector Shape
  text_video_page_vector: (data: any) => ({
    templateId: 'tpl_5_text_video_page_vector',
    type: 'text_video_page_vector',
    data: {
      text: data.text || 'Dynamic Video Stream & Page Performance Analytics',
      videoUrl: data.videoUrl || data.video || '/edoffice/ed.webp',
      pageUrl: data.pageUrl || '/office/david',
      pageTitle: data.pageTitle || 'Watch Video & Inspect Page',
      vectorShape: data.vectorShape || { type: 'circle', color: '#FFC800', label: 'Live Video' },
      badge: data.badge || 'Media Stream'
    }
  }),

  // 6. Text + Video Link
  text_video_link: (data: any) => ({
    templateId: 'tpl_6_text_video_link',
    type: 'text_video_link',
    data: {
      text: data.text || 'Smart Worker Interactive Video Feed',
      videoUrl: data.videoUrl || '/edoffice/ed.webp',
      badge: data.badge || 'HD Loop'
    }
  }),

  // 7. Interactive Chart / Graph Template
  chart_graph_card: (data: any) => ({
    templateId: 'tpl_7_chart_graph_card',
    type: 'chart_graph_card',
    data: {
      text: data.text || 'Database Traffic & Conversion Growth Chart',
      chartData: data.chartData || {
        title: 'Monthly Page Visits & Lead Acquisition',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [420, 680, 890, 1120, 1450, 1820],
        type: 'bar'
      },
      vectorShape: data.vectorShape || { type: 'chart', color: '#FFC800', label: 'Visual Chart' },
      badge: data.badge || 'Analytics'
    }
  }),

  // 8. Excel Data Grid / Table Template
  excel_table_card: (data: any) => ({
    templateId: 'tpl_8_excel_table_card',
    type: 'excel_table_card',
    data: {
      text: data.text || 'Structured Excel Data Grid - Database Audit',
      tableData: data.tableData || {
        title: 'Database Pages & Revenue Summary Table',
        headers: ['Page Title', 'Visits', 'Conversions', 'Conversion Rate', 'Status'],
        rows: [
          { 'Page Title': "David's Office - analyze-mode.", 'Visits': '580', 'Conversions': '78', 'Conversion Rate': '13.4%', 'Status': 'Active' },
          { 'Page Title': "David's Office - growth-mode.", 'Visits': '430', 'Conversions': '56', 'Conversion Rate': '13.0%', 'Status': 'Active' },
          { 'Page Title': 'Smart Executive AI Event Page', 'Visits': '510', 'Conversions': '65', 'Conversion Rate': '12.7%', 'Status': 'Event' },
          { 'Page Title': 'AI Agent System Article', 'Visits': '440', 'Conversions': '52', 'Conversion Rate': '11.8%', 'Status': 'Post' },
          { 'Page Title': 'Premium Smart Office Service', 'Visits': '390', 'Conversions': '48', 'Conversion Rate': '12.3%', 'Status': 'Service' }
        ]
      },
      vectorShape: data.vectorShape || { type: 'table', color: '#FFC800', label: 'Excel Grid' },
      badge: data.badge || 'Table Data'
    }
  }),

  // 9. iFrame / Embedded Web View Window Template
  iframe_view_card: (data: any) => ({
    templateId: 'tpl_9_iframe_view_card',
    type: 'iframe_view_card',
    data: {
      text: data.text || 'Live iFrame Web View Preview',
      iframeUrl: data.iframeUrl || data.url || '/office/david',
      iframeTitle: data.iframeTitle || 'Smart Digital Office View Window',
      vectorShape: data.vectorShape || { type: 'shield', color: '#FFC800', label: 'Live iFrame' },
      badge: data.badge || 'Web View'
    }
  })
};

/**
 * Server Automatic Template Matcher (Steps 4 -> 5 in Architecture Diagram)
 */
export function matchAndPopulateTemplate(dbData: any, userQuery: string): JSONTemplateComponent[] {
  const q = userQuery.toLowerCase();
  const components: JSONTemplateComponent[] = [];
  if (q.includes('contact') || q.includes('moti') || q.includes('card') || q.includes('person') || q.includes('profile') || q.includes('איש קשר') || q.includes('כרטיס')) {
    const contactItem = dbData.contactsSummary?.items?.find((c: any) => c.name.toLowerCase().includes("moti")) ||
      dbData.contactsSummary?.items?.[0] || { id: "cnt_001", name: "Moti Cohen", email: "moti@partner.com", phone: "+972-50-9876543", role: "Senior VIP Client", company: "Moti Digital Ltd", status: "Active Partner" };

    components.push(
      JSON_TEMPLATE_LIBRARY.text_image_page_vector({
        text: `Contact Profile Card: ${contactItem.name} (${contactItem.company || 'Enterprise'})`,
        imageUrl: '/edoffice/ed.webp',
        pageUrl: `/office/david`,
        pageTitle: `Contact Details: ${contactItem.email}`,
        vectorShape: { type: 'star', color: '#FFC800', label: 'VIP Contact' },
        badge: contactItem.status || 'Active Contact',
        metrics: {
          name: contactItem.name,
          email: contactItem.email,
          phone: contactItem.phone,
          role: contactItem.role
        }
      })
    );

    components.push(
      JSON_TEMPLATE_LIBRARY.excel_table_card({
        text: `Interactive Contact Data Table (Edit & Delete Available)`,
        tableData: {
          title: `Contact Card - ${contactItem.name}`,
          headers: ['Full Name', 'ID', 'Phone', 'Email', 'Role', 'Status'],
          rows: [
            {
              'Full Name': contactItem.name,
              'ID': contactItem.id || 'cnt_001',
              'Phone': contactItem.phone || '+972-50-9876543',
              'Email': contactItem.email,
              'Role': contactItem.role,
              'Status': contactItem.status || 'Active Partner'
            }
          ]
        },
        vectorShape: { type: 'table', color: '#FFC800', label: 'Contact Card' },
        badge: 'Editable Card'
      })
    );
  } else if (q.includes('sub') || q.includes('subscription') || q.includes('subscriptions') || q.includes('order') || q.includes('billing') || q.includes('oldest') || q.includes('newest') || q.includes('מנוי') || q.includes('מנויים') || q.includes('רכישות') || q.includes('הזמנות')) {
    const subs = dbData.subscriptionsSummary?.items || [
      { date: "2024-01-10", user: "Sarah Manager (sarah@c-g-ltd.com)", plan: "Smart Worker Enterprise Plan", amount: "₪4,900", status: "Active" },
      { date: "2024-02-14", user: "Michael Client (michael@partner.com)", plan: "Digital Agent Pro License", amount: "₪2,450", status: "Active" },
      { date: "2024-03-01", user: "Alex Developer (alex@partner.com)", plan: "Developer API Suite Subscription", amount: "₪1,800", status: "Active" },
      { date: "2024-04-18", user: "Dotty Designer (dotty@partner.com)", plan: "Creative AI Asset Workspace", amount: "₪1,200", status: "Active" },
      { date: "2024-05-22", user: "David Admin (admin@c-g-ltd.com)", plan: "Executive AI Command Suite", amount: "₪8,500", status: "Active" },
      { date: "2024-06-11", user: "Partner Agency (contact@partner.com)", plan: "Multi-Tenant Agency License", amount: "₪12,000", status: "Active" }
    ];

    const rows = subs.map((s: any) => ({
      'Date (Oldest to Newest)': s.date,
      'Subscriber / Member': s.user,
      'Subscription Plan': s.plan,
      'Amount': s.amount,
      'Status': s.status
    }));

    components.push(
      JSON_TEMPLATE_LIBRARY.excel_table_card({
        text: `List of Subscriptions (${subs.length} Subscriptions Sorted Oldest to Newest)`,
        tableData: {
          title: 'Subscriptions Ledger Table (Oldest -> Newest)',
          headers: ['Date (Oldest to Newest)', 'Subscriber / Member', 'Subscription Plan', 'Amount', 'Status'],
          rows
        },
        vectorShape: { type: 'table', color: '#FFC800', label: 'Subscriptions' },
        badge: 'Oldest to Newest'
      })
    );
  } else if (q.includes('chart') || q.includes('graph') || q.includes('גרף') || q.includes('תרשים') || q.includes('מגמה')) {
    components.push(
      JSON_TEMPLATE_LIBRARY.chart_graph_card({
        text: `Traffic & Lead Growth Chart for ${dbData.activeUser?.name || 'Workspace'}`,
        chartData: {
          title: 'Database Traffic Visits Across Allowed Collections',
          labels: ['Offices', 'Landing', 'Events', 'Posts', 'Services'],
          values: [1010, 1130, 510, 440, 390],
          type: 'bar'
        },
        vectorShape: { type: 'chart', color: '#FFC800', label: 'Visual Chart' },
        badge: 'Live Metrics'
      })
    );
  } else if (q.includes('excel') || q.includes('table') || q.includes('טבלה') || q.includes('אקסל') || q.includes('נתונים') || q.includes('columns') || q.includes('column')) {
    // Check if table request is for USERS (e.g. "Table with 3 columns with user data Full name - ID - Phone")
    if (q.includes('user') || q.includes('member') || q.includes('phone') || q.includes('name') || q.includes('id') || q.includes('משתמש')) {
      const rawUsers = dbData.usersSummary?.rawUsers || [
        { id: "usr_001", name: "David Admin", email: "admin@c-g-ltd.com", role: "Administrator", phone: "+972-50-1112233" },
        { id: "usr_002", name: "Sarah Manager", email: "sarah@c-g-ltd.com", role: "Manager", phone: "+972-52-4445566" },
        { id: "usr_003", name: "Michael Client", email: "michael@partner.com", role: "Client", phone: "+972-54-7778899" },
        { id: "usr_004", name: "Alex Developer", email: "alex@partner.com", role: "Developer", phone: "+972-53-9990011" },
        { id: "usr_005", name: "Dotty Designer", email: "dotty@partner.com", role: "Designer", phone: "+972-58-2223344" }
      ];

      const rows = rawUsers.map((u: any) => ({
        'Full Name': u.name,
        'ID': u.id,
        'Phone': u.phone || "+972-50-1234567",
        'Email': u.email,
        'Role': u.role
      }));

      components.push(
        JSON_TEMPLATE_LIBRARY.excel_table_card({
          text: `User Database Table (${rawUsers.length} Registered Members)`,
          tableData: {
            title: 'User Data Table (Full Name - ID - Phone)',
            headers: ['Full Name', 'ID', 'Phone', 'Email', 'Role'],
            rows
          },
          vectorShape: { type: 'table', color: '#FFC800', label: 'User Table' },
          badge: 'User Data'
        })
      );
    } else {
      // Pages Data Table
      const rawPages = dbData.pagesSummary?.pagesList || [
        { title: "David's Office - analyze-mode.", views: 580, conversions: 78, source: "Digital Office" },
        { title: "David's Office - growth-mode.", views: 430, conversions: 56, source: "Digital Office" },
        { title: "Smart Executive AI Event Page", views: 510, conversions: 65, source: "Event Page" },
        { title: "AI Agent System Article", views: 440, conversions: 52, source: "Post Page" },
        { title: "Premium Smart Office Service Page", views: 390, conversions: 48, source: "Service Page" }
      ];

      const rows = rawPages.map((p: any) => ({
        'Collection / Title': p.title,
        'Visits': String(p.views || p.visits || 400),
        'Leads': String(p.conversions || p.leads || 50),
        'Conv. Rate': `${(((p.conversions || 50) / (p.views || 400)) * 100).toFixed(1)}%`,
        'Status': p.source || 'Active'
      }));

      components.push(
        JSON_TEMPLATE_LIBRARY.excel_table_card({
          text: `Excel Data Grid Audit (${dbData.pagesSummary?.totalPages || 9} Total Pages)`,
          tableData: {
            title: 'Structured System Database Table',
            headers: ['Collection / Title', 'Visits', 'Leads', 'Conv. Rate', 'Status'],
            rows
          },
          vectorShape: { type: 'table', color: '#FFC800', label: 'Excel Grid' },
          badge: 'Excel Grid'
        })
      );
    }
  } else if (q.includes('iframe') || q.includes('preview') || q.includes('חלון') || q.includes('אתר')) {
    components.push(
      JSON_TEMPLATE_LIBRARY.iframe_view_card({
        text: `Live iFrame Embedded Preview Window`,
        iframeUrl: `/office/david`,
        iframeTitle: `Smart Digital Office Window (${dbData.activeUser?.name || 'David'})`,
        vectorShape: { type: 'shield', color: '#FFC800', label: 'Live iFrame' },
        badge: 'Embedded Window'
      })
    );
  } else if (q.includes('video') || q.includes('media') || q.includes('סרטון') || q.includes('וידאו')) {
    components.push(
      JSON_TEMPLATE_LIBRARY.text_video_page_vector({
        text: `Live Video & Media Analytics for ${dbData.activeUser?.name || 'Workspace'}`,
        videoUrl: '/edoffice/ed.webp',
        pageUrl: `/office/david`,
        pageTitle: 'Open Media Dashboard',
        vectorShape: { type: 'circle', color: '#FFC800', label: 'Live Stream' },
        badge: 'Media Stream'
      })
    );
  } else if (q.includes('page') || q.includes('landing') || q.includes('event') || q.includes('post') || q.includes('service') || q.includes('עמוד') || q.includes('דף')) {
    components.push(
      JSON_TEMPLATE_LIBRARY.text_image_page_vector({
        text: `Comprehensive Database Page Scan (${dbData.pagesSummary?.totalPages || 9} Total Pages)`,
        imageUrl: '/edoffice/ed.webp',
        pageUrl: `/office/david`,
        pageTitle: `Inspect Top Page "${dbData.pagesSummary?.topPageName || 'Smart Office'}"`,
        vectorShape: { type: 'shield', color: '#FFC800', label: 'Multi-Collection' },
        badge: `${dbData.pagesSummary?.totalPageViews?.toLocaleString() || '4,120'} Visits`,
        metrics: {
          totalPages: dbData.pagesSummary?.totalPages || 9,
          totalVisits: dbData.pagesSummary?.totalPageViews || 4120,
          conversions: dbData.pagesSummary?.totalConversions || 508
        }
      })
    );
    components.push(
      JSON_TEMPLATE_LIBRARY.excel_table_card({
        text: `Pages Directory Table (${dbData.pagesSummary?.totalPages || 9} Pages)`,
        tableData: {
          title: 'Database Pages & Performance Table',
          headers: ['Page Title', 'Visits', 'Leads', 'Status'],
          rows: [
            { 'Page Title': "David's Office - analyze-mode.", 'Visits': '580', 'Leads': '78', 'Status': 'Active' },
            { 'Page Title': "David's Office - growth-mode.", 'Visits': '430', 'Leads': '56', 'Status': 'Active' },
            { 'Page Title': 'Smart Executive AI Event Page', 'Visits': '510', 'Leads': '65', 'Status': 'Event' },
            { 'Page Title': 'AI Agent System Article', 'Visits': '440', 'Leads': '52', 'Status': 'Post' },
            { 'Page Title': 'Premium Smart Office Service', 'Visits': '390', 'Leads': '48', 'Status': 'Service' }
          ]
        }
      })
    );
  } else if (q.includes('user') || q.includes('admin') || q.includes('role') || q.includes('member') || q.includes('משתמש')) {
    components.push(
      JSON_TEMPLATE_LIBRARY.text_vector_shape({
        text: `User Database Audit for ${dbData.activeUser?.name || 'User'}: ${dbData.usersSummary?.totalUsers || 14} Registered Members (${dbData.usersSummary?.adminsCount || 3} Admins, ${dbData.usersSummary?.clientsCount || 7} Clients)`,
        vectorShape: { type: 'rhombus', color: '#FFC800', label: 'Security L1' },
        badge: 'User Verified',
        metrics: {
          totalUsers: dbData.usersSummary?.totalUsers || 14,
          role: dbData.activeUser?.role || 'Administrator'
        }
      })
    );
    components.push(
      JSON_TEMPLATE_LIBRARY.text_image_page_vector_alt({
        text: `Active Member Directory (${dbData.usersSummary?.sampleUsers || 'David Admin, Sarah Manager'})`,
        imageUrl: '/edoffice/ed.webp',
        pageUrl: `/office/david`,
        pageTitle: 'User Authorization Panel',
        vectorShape: { type: 'sparkle', color: '#FFC800', label: 'Members' },
        badge: 'Active Now'
      })
    );
  } else {
    // Default Fallback
    components.push(
      JSON_TEMPLATE_LIBRARY.chart_graph_card({
        text: `Database Traffic Overview for ${dbData.activeUser?.name || 'Executive'}`,
        chartData: {
          title: 'System Traffic & Lead Conversions Overview',
          labels: ['Offices', 'Landing', 'Events', 'Posts', 'Services'],
          values: [1010, 1130, 510, 440, 390],
          type: 'bar'
        },
        vectorShape: { type: 'chart', color: '#FFC800', label: 'Metrics' }
      })
    );
    components.push(
      JSON_TEMPLATE_LIBRARY.text_image_page_vector({
        text: `Database Intelligence Report for ${dbData.activeUser?.name || 'Executive'}`,
        imageUrl: '/edoffice/ed.webp',
        pageUrl: `/office/david`,
        pageTitle: 'Explore Office Analytics',
        vectorShape: { type: 'shield', color: '#FFC800', label: 'System Sync' },
        badge: 'Live Database',
        metrics: {
          users: dbData.usersSummary?.totalUsers || 14,
          pages: dbData.pagesSummary?.totalPages || 9,
          revenue: `₪${(dbData.crmSummary?.totalRevenueILS || 158400).toLocaleString()}`
        }
      })
    );
  }

  return components;
}
