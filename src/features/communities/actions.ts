"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { auth } from "@/lib/auth";
import { Community } from "./types";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }
  throw new Error("Unauthorized");
}

export async function getCommunities() {
  try {
    const ownerId = await getUserId();
    const snapshot = await adminDb
      .collection("communities")
      .where("ownerId", "==", ownerId)
      .orderBy("createdAt", "desc")
      .get();

    const communitiesWithCount = await Promise.all(
      snapshot.docs.map(async (doc: any) => {
        const countSnap = await adminDb
          .collection("contacts")
          .where("ownerId", "==", ownerId)
          .where("communityIds", "array-contains", doc.id)
          .count()
          .get();
        
        return {
          id: doc.id,
          ...doc.data(),
          memberCount: countSnap.data().count,
        };
      })
    );

    return JSON.parse(JSON.stringify(communitiesWithCount)) as any[];
  } catch (error: any) {
    console.error("Error in getCommunities:", error);
    return [];
  }
}

export async function createCommunity(data: Partial<Community>) {
  try {
    const ownerId = await getUserId();
    
    const newDoc = {
      ...data,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("communities").add(newDoc);
    
    revalidatePath("/dashboard/communities");
    revalidatePath("/dashboard/crm");
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error in createCommunity:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCommunity(id: string, data: Partial<Community>) {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("communities").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("Community not found");
    }

    if (docSnap.data()?.ownerId !== ownerId) {
      throw new Error("Unauthorized");
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updateData);
    
    revalidatePath("/dashboard/communities");
    revalidatePath("/dashboard/crm");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateCommunity:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCommunity(id: string) {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("communities").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("Community not found");
    }

    if (docSnap.data()?.ownerId !== ownerId) {
      throw new Error("Unauthorized");
    }

    await docRef.delete();
    
    revalidatePath("/dashboard/communities");
    revalidatePath("/dashboard/crm");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteCommunity:", error);
    return { success: false, error: error.message };
  }
}

export async function migrateContactsToGeneralCommunity() {
  try {
    const ownerId = await getUserId();
    
    // Check if General community exists
    const communitiesRef = adminDb.collection("communities");
    const snapshot = await communitiesRef
      .where("ownerId", "==", ownerId)
      .where("name", "==", "קהילה כללית")
      .limit(1)
      .get();
      
    let generalCommunityId = "";
    
    if (snapshot.empty) {
      // Create General community
      const newDoc = {
        name: "קהילה כללית",
        color: "#64748b", // slate-500
        icon: "Users",
        description: "קהילת ברירת מחדל לכל אנשי הקשר במערכת",
        files: [],
        ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const docRef = await communitiesRef.add(newDoc);
      generalCommunityId = docRef.id;
    } else {
      generalCommunityId = snapshot.docs[0].id;
    }
    
    // Fetch all contacts
    const contactsRef = adminDb.collection("contacts");
    const contactsSnap = await contactsRef.where("ownerId", "==", ownerId).get();
    
    const batch = adminDb.batch();
    let count = 0;
    
    contactsSnap.forEach(doc => {
      const data = doc.data();
      const communityIds = data.communityIds || [];
      if (communityIds.length === 0) {
        batch.update(doc.ref, { communityIds: [generalCommunityId] });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
    }
    
    return { success: true, migratedCount: count, generalCommunityId };
  } catch (error: any) {
    console.error("Error migrating contacts:", error);
    return { success: false, error: error.message };
  }
}
