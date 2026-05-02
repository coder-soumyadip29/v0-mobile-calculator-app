import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp, doc, updateDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC72k7ZhlWobsJ3zJcC2YkOhYfoQBQH89o",
  authDomain: "sossystem12.firebaseapp.com",
  projectId: "sossystem12",
  storageBucket: "sossystem12.firebasestorage.app",
  messagingSenderId: "304688779313",
  appId: "1:304688779313:web:159be4892c6ca852f44510"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export interface SOSAlert {
  id?: string
  latitude: number | null
  longitude: number | null
  timestamp: string
  status: "active" | "responding" | "resolved"
  transcript?: string
}

export async function sendSOSAlert(alert: Omit<SOSAlert, "id">) {
  try {
    const docRef = await addDoc(collection(db, "alerts"), {
      ...alert,
      transcript: "",
      createdAt: Timestamp.now()
    })
    console.log("[Firebase] SOS Alert sent with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[Firebase] Error sending SOS alert:", error)
    throw error
  }
}

export async function updateSOSTranscript(alertId: string, transcript: string) {
  try {
    const alertRef = doc(db, "alerts", alertId)
    await updateDoc(alertRef, { transcript })
    console.log("[Firebase] Transcript updated for alert:", alertId)
  } catch (error) {
    console.error("[Firebase] Error updating transcript:", error)
    throw error
  }
}

export function subscribeToAlerts(callback: (alerts: SOSAlert[]) => void) {
  const alertsQuery = query(
    collection(db, "alerts"),
    orderBy("createdAt", "desc"),
    limit(10)
  )

  return onSnapshot(alertsQuery, (snapshot) => {
    const alerts: SOSAlert[] = []
    snapshot.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data()
      } as SOSAlert)
    })
    callback(alerts)
  }, (error) => {
    console.error("[Firebase] Error listening to alerts:", error)
  })
}

export { db }
