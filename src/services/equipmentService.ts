import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Equipment, EquipmentUnit, BorrowRecord, QuotaPolicy } from '../types';
import { INITIAL_EQUIPMENT, INITIAL_BORROW_RECORDS, INITIAL_QUOTA_POLICIES } from '../data/initialData';

const EQUIPMENTS_COLLECTION = 'equipments';
const BORROW_RECORDS_COLLECTION = 'borrow_records';
const QUOTA_POLICIES_COLLECTION = 'quota_policies';

/**
 * Initializes Firestore collections with starter data if empty
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const eqSnapshot = await getDocs(collection(db, EQUIPMENTS_COLLECTION));
    if (eqSnapshot.empty) {
      console.log('Seeding initial equipment to Firestore...');
      const batch = writeBatch(db);

      // Seed equipments
      for (const eq of INITIAL_EQUIPMENT) {
        const ref = doc(db, EQUIPMENTS_COLLECTION, eq.id);
        batch.set(ref, eq);
      }

      // Seed borrow records
      for (const rec of INITIAL_BORROW_RECORDS) {
        const ref = doc(db, BORROW_RECORDS_COLLECTION, rec.id);
        batch.set(ref, rec);
      }

      // Seed quota policies
      for (let i = 0; i < INITIAL_QUOTA_POLICIES.length; i++) {
        const pol = INITIAL_QUOTA_POLICIES[i];
        const ref = doc(db, QUOTA_POLICIES_COLLECTION, `policy-${i + 1}`);
        batch.set(ref, { id: `policy-${i + 1}`, ...pol });
      }

      await batch.commit();
      console.log('Successfully seeded initial Firestore data for That Thong hospital.');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

/**
 * Real-time listener for Equipments
 */
export function subscribeToEquipments(
  onUpdate: (data: Equipment[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onSnapshot(
    collection(db, EQUIPMENTS_COLLECTION),
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as Equipment);
        // Sort by id for stability
        items.sort((a, b) => a.id.localeCompare(b.id));
        onUpdate(items);
      } else {
        onUpdate([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, EQUIPMENTS_COLLECTION);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Real-time listener for Borrow Records
 */
export function subscribeToBorrowRecords(
  onUpdate: (data: BorrowRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onSnapshot(
    collection(db, BORROW_RECORDS_COLLECTION),
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as BorrowRecord);
        // Sort newest first
        items.sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));
        onUpdate(items);
      } else {
        onUpdate([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, BORROW_RECORDS_COLLECTION);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Real-time listener for Quota Policies
 */
export function subscribeToQuotaPolicies(
  onUpdate: (data: QuotaPolicy[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onSnapshot(
    collection(db, QUOTA_POLICIES_COLLECTION),
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as QuotaPolicy);
        onUpdate(items);
      } else {
        onUpdate(INITIAL_QUOTA_POLICIES);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, QUOTA_POLICIES_COLLECTION);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Creates a new Loan in Firestore and updates the unit status to 'borrowed'
 */
export async function createLoanTransaction(
  newRecord: BorrowRecord,
  allEquipments: Equipment[]
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Add record doc
  const recordRef = doc(db, BORROW_RECORDS_COLLECTION, newRecord.id);
  batch.set(recordRef, newRecord);

  // 2. Update equipment unit
  const targetEquipment = allEquipments.find((e) => e.id === newRecord.equipmentId);
  if (targetEquipment) {
    const updatedUnits = targetEquipment.units.map((u) => {
      if (u.id === newRecord.unitId) {
        return {
          ...u,
          status: 'borrowed' as const,
          currentBorrowRecordId: newRecord.id,
        };
      }
      return u;
    });

    const eqRef = doc(db, EQUIPMENTS_COLLECTION, targetEquipment.id);
    batch.update(eqRef, { units: updatedUnits });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${BORROW_RECORDS_COLLECTION}/${newRecord.id}`);
  }
}

/**
 * Records return of an item in Firestore and sets unit status back to 'available' or 'repair'
 */
export async function returnItemTransaction(
  recordId: string,
  returnDate: string,
  condition: string,
  receiverStaff: string,
  returnNote: string,
  markForRepair: boolean,
  currentRecord: BorrowRecord,
  allEquipments: Equipment[]
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Update loan record doc
  const recordRef = doc(db, BORROW_RECORDS_COLLECTION, recordId);
  batch.update(recordRef, {
    returnDate,
    returnedCondition: condition,
    receiverStaff,
    returnNote,
    status: 'returned',
  });

  // 2. Update equipment unit doc
  const targetEquipment = allEquipments.find((e) => e.id === currentRecord.equipmentId);
  if (targetEquipment) {
    const updatedUnits = targetEquipment.units.map((u) => {
      if (u.id === currentRecord.unitId) {
        return {
          ...u,
          status: (markForRepair ? 'repair' : 'available') as 'repair' | 'available',
          condition: markForRepair ? ('ชำรุดรอซ่อม' as const) : ('ปกติ' as const),
          currentBorrowRecordId: null,
        };
      }
      return u;
    });

    const eqRef = doc(db, EQUIPMENTS_COLLECTION, targetEquipment.id);
    batch.update(eqRef, { units: updatedUnits });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${BORROW_RECORDS_COLLECTION}/${recordId}`);
  }
}

/**
 * Adds new Equipment to Firestore
 */
export async function addEquipmentToFirestore(equipment: Equipment): Promise<void> {
  const path = `${EQUIPMENTS_COLLECTION}/${equipment.id}`;
  try {
    await setDoc(doc(db, EQUIPMENTS_COLLECTION, equipment.id), equipment);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Adds new physical unit to existing equipment
 */
export async function addUnitToFirestore(
  equipmentId: string,
  currentEquipment: Equipment,
  newUnit: EquipmentUnit
): Promise<void> {
  const updatedUnits = [...currentEquipment.units, newUnit];
  const path = `${EQUIPMENTS_COLLECTION}/${equipmentId}`;
  try {
    await updateDoc(doc(db, EQUIPMENTS_COLLECTION, equipmentId), {
      totalUnits: updatedUnits.length,
      units: updatedUnits,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Toggles equipment unit status between available and repair
 */
export async function toggleUnitRepairInFirestore(
  equipmentId: string,
  currentEquipment: Equipment,
  unitId: string,
  currentStatus: string
): Promise<void> {
  const nextStatus = currentStatus === 'repair' ? 'available' : 'repair';
  const updatedUnits = currentEquipment.units.map((u) => {
    if (u.id === unitId) {
      return {
        ...u,
        status: nextStatus as 'repair' | 'available',
        condition: nextStatus === 'repair' ? ('ชำรุดรอซ่อม' as const) : ('สภาพดี' as const),
      };
    }
    return u;
  });

  const path = `${EQUIPMENTS_COLLECTION}/${equipmentId}`;
  try {
    await updateDoc(doc(db, EQUIPMENTS_COLLECTION, equipmentId), {
      units: updatedUnits,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Updates an existing equipment's general information (name, category, description, quotaDays, imageUrl, etc.)
 */
export async function updateEquipmentInFirestore(
  equipmentId: string,
  updatedFields: Partial<Equipment>
): Promise<void> {
  const path = `${EQUIPMENTS_COLLECTION}/${equipmentId}`;
  try {
    await updateDoc(doc(db, EQUIPMENTS_COLLECTION, equipmentId), updatedFields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Updates an individual physical unit within an equipment document
 */
export async function updateUnitInFirestore(
  equipmentId: string,
  currentEquipment: Equipment,
  updatedUnit: EquipmentUnit
): Promise<void> {
  const updatedUnits = currentEquipment.units.map((u) =>
    u.id === updatedUnit.id ? updatedUnit : u
  );
  const path = `${EQUIPMENTS_COLLECTION}/${equipmentId}`;
  try {
    await updateDoc(doc(db, EQUIPMENTS_COLLECTION, equipmentId), {
      units: updatedUnits,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes an entire equipment category/document from Firestore
 */
export async function deleteEquipmentFromFirestore(equipmentId: string): Promise<void> {
  const path = `${EQUIPMENTS_COLLECTION}/${equipmentId}`;
  try {
    await deleteDoc(doc(db, EQUIPMENTS_COLLECTION, equipmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Deletes an individual unit from an equipment document in Firestore
 */
export async function deleteUnitFromFirestore(
  equipmentId: string,
  currentEquipment: Equipment,
  unitId: string
): Promise<void> {
  const updatedUnits = currentEquipment.units.filter((u) => u.id !== unitId);
  const path = `${EQUIPMENTS_COLLECTION}/${equipmentId}`;
  try {
    await updateDoc(doc(db, EQUIPMENTS_COLLECTION, equipmentId), {
      totalUnits: updatedUnits.length,
      units: updatedUnits,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Reset all data to sample initial state in Firestore
 */
export async function resetFirestoreToSample(): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Delete existing
    const eqSnap = await getDocs(collection(db, EQUIPMENTS_COLLECTION));
    eqSnap.forEach((d) => batch.delete(d.ref));

    const recSnap = await getDocs(collection(db, BORROW_RECORDS_COLLECTION));
    recSnap.forEach((d) => batch.delete(d.ref));

    // Re-seed
    for (const eq of INITIAL_EQUIPMENT) {
      batch.set(doc(db, EQUIPMENTS_COLLECTION, eq.id), eq);
    }
    for (const rec of INITIAL_BORROW_RECORDS) {
      batch.set(doc(db, BORROW_RECORDS_COLLECTION, rec.id), rec);
    }
    for (let i = 0; i < INITIAL_QUOTA_POLICIES.length; i++) {
      const pol = INITIAL_QUOTA_POLICIES[i];
      batch.set(doc(db, QUOTA_POLICIES_COLLECTION, `policy-${i + 1}`), {
        id: `policy-${i + 1}`,
        ...pol,
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'reset_sample');
  }
}

/**
 * Clears all borrow records and resets all equipment units to available (0 borrowed)
 */
export async function clearAllBorrowingsToZero(): Promise<void> {
  try {
    const batch = writeBatch(db);

    // 1. Delete all borrow records
    const recSnap = await getDocs(collection(db, BORROW_RECORDS_COLLECTION));
    recSnap.forEach((d) => batch.delete(d.ref));

    // 2. Reset all equipment units to available
    const eqSnap = await getDocs(collection(db, EQUIPMENTS_COLLECTION));
    eqSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.units && Array.isArray(data.units)) {
        const resetUnits = data.units.map((u: any) => ({
          ...u,
          status: 'available',
          condition: u.condition === 'ชำรุดรอซ่อม' ? 'สภาพดี' : u.condition || 'สภาพดี',
        }));
        const cleanUnits = resetUnits.map((u: any) => {
          const copy = { ...u };
          delete copy.currentBorrowRecordId;
          return copy;
        });
        batch.update(doc(db, EQUIPMENTS_COLLECTION, docSnap.id), {
          units: cleanUnits,
        });
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'clear_borrowings');
  }
}

