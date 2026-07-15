import { adminDb } from "../src/lib/firebaseAdmin";
async function backfill() {
  console.log("Starting backfill...");
  const collections = ["services", "landing_pages", "posts"];
  
  for (const col of collections) {
    const snap = await adminDb.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const views = data.views || 0;
      if (views > 0) {
        // check how many analytics events we already have for this slug
        const analyticsSnap = await adminDb.collection("analytics_events").where("slug", "==", doc.id).get();
        const existingCount = analyticsSnap.size;
        const toAdd = views - existingCount;
        
        if (toAdd > 0) {
          console.log(`Adding ${toAdd} missing views for ${col}/${doc.id}`);
          const ownerId = data.ownerId || "1";
          const title = data.title || doc.id;
          
          for (let i = 0; i < toAdd; i++) {
             // fake timestamp spread across recent days
             const d = new Date();
             d.setDate(d.getDate() - (i % 7));
             await adminDb.collection("analytics_events").add({
                ownerId,
                slug: doc.id,
                collectionName: col,
                title,
                type: "landing_page_view",
                timestamp: d.toISOString()
             });
          }
        }
      }
    }
  }
  console.log("Backfill complete.");
}
backfill().catch(console.error);
