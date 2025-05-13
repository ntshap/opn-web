"use client"

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useMembers } from "@/hooks/useMembers"
import { useAttendanceMutations } from "@/hooks/useEvents"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSavedAttendanceData, saveAttendanceData } from "@/utils/attendance-utils"

interface MemberAttendanceFormProps {
  eventId: string | number
  onAttendanceChange?: (records: Array<{ member_id: number; status: string; notes: string }>) => void
}

// Export the component with forwardRef to allow parent components to access its methods
export const MemberAttendanceForm = forwardRef<
  {
    handleSaveAttendance: () => Promise<void>,
    getAttendanceData: () => Array<{ member_id: number; status: string; notes: string }>
  },
  MemberAttendanceFormProps
>(({ eventId, onAttendanceChange }, ref) => {
  const { toast } = useToast()
  const { data: members = [], isLoading: isMembersLoading } = useMembers()
  const { createOrUpdateAttendance } = useAttendanceMutations(eventId)

  // State for attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<Array<{
    member_id: number;
    name: string;
    division: string;
    status: string;
    notes: string;
  }>>([])

  // State for active division tab
  const [activeTab, setActiveTab] = useState<string>("all")

  // Track if initial setup is done
  const [isInitialized, setIsInitialized] = useState(false)

  // Get unique divisions from members data
  const divisions = useMemo(() => {
    if (!members || Object.keys(members).length === 0) return [];

    // Process division names to handle numeric keys
    return Object.keys(members).map(key => {
      // Use a default division name for numeric keys
      return /^\d+$/.test(key) ? `Divisi ${key}` : key;
    }).filter(division => {
      // Only include divisions that have members
      const membersList = members[division] || members[division.replace('Divisi ', '')];
      return membersList && (Array.isArray(membersList) ? membersList.length > 0 : Object.keys(membersList).length > 0);
    });
  }, [members])

  // Initialize attendance records from members data - only once when members data is loaded
  useEffect(() => {
    if (!isInitialized && members && Object.keys(members).length > 0) {
      try {
        console.log('Initializing attendance records with members data:', members);

        // Create a normalized version of the members data
        const normalizedMembers: Record<string, any[]> = {};

        // Process the members data to ensure it's in the correct format
        Object.entries(members).forEach(([key, value]) => {
          // Use a default division name for numeric keys
          const divisionName = /^\d+$/.test(key) ? `Divisi ${key}` : key;

          // Handle different data formats
          if (Array.isArray(value)) {
            // If it's already an array, use it directly
            normalizedMembers[divisionName] = value;
          } else if (value && typeof value === 'object') {
            // If it's an object but not an array, convert it to an array with a single item
            if (value.id && value.full_name) {
              normalizedMembers[divisionName] = [value];
            } else {
              // If it's an object with multiple members
              const membersArray = Object.values(value).filter(item =>
                item && typeof item === 'object' && item.id && item.full_name
              );
              if (membersArray.length > 0) {
                normalizedMembers[divisionName] = membersArray;
              } else {
                normalizedMembers[divisionName] = [];
              }
            }
          } else {
            // If it's neither an array nor a valid object, use an empty array
            normalizedMembers[divisionName] = [];
          }
        });

        console.log('Normalized members data:', normalizedMembers);

        // Load saved attendance data from localStorage using our utility function
        const savedAttendanceData = getSavedAttendanceData(eventId);
        console.log(`[MemberAttendanceForm] Loaded ${savedAttendanceData.length} saved attendance records from localStorage:`, savedAttendanceData);

        // Create initial attendance records from the normalized data
        const initialRecords = Object.entries(normalizedMembers).flatMap(([division, membersList]) => {
          if (!Array.isArray(membersList) || membersList.length === 0) {
            return [];
          }

          return membersList.map((member: any) => {
            // Ensure we have valid member data
            if (!member || typeof member !== 'object') return null;

            const memberId = typeof member.id === 'number' ? member.id :
                           typeof member.id === 'string' ? parseInt(member.id, 10) : 0;

            if (isNaN(memberId) || memberId <= 0) return null;

            // Check if we have saved attendance data for this member
            const savedRecord = savedAttendanceData.find(a => a.member_id === memberId);

            return {
              member_id: memberId,
              name: member.full_name || 'Tidak ada nama',
              division: division,
              status: savedRecord ? savedRecord.status : "Hadir", // Use saved status or default
              notes: savedRecord ? (savedRecord.notes || "") : ""
            };
          }).filter(Boolean); // Remove null entries
        });

        console.log('Created initial attendance records:', initialRecords);
        setAttendanceRecords(initialRecords);

        // Set the first division as active tab if available
        const divisionsList = Object.keys(normalizedMembers).filter(div =>
          Array.isArray(normalizedMembers[div]) && normalizedMembers[div].length > 0
        );

        if (divisionsList.length > 0) {
          setActiveTab(divisionsList[0]);
        } else {
          setActiveTab("all"); // Default to "all" if no divisions with members
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing attendance records:', error);
        // Initialize with empty array to prevent further errors
        setAttendanceRecords([]);
        setIsInitialized(true);
      }
    }
  }, [members, isInitialized, eventId])

  // Filter records by active division for better performance
  const filteredRecords = useMemo(() => {
    if (activeTab === "all") {
      return attendanceRecords
    }
    return attendanceRecords.filter(record => record.division === activeTab)
  }, [attendanceRecords, activeTab])

  // Handle status change
  const handleStatusChange = (memberId: number, status: string) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.member_id === memberId
          ? { ...record, status }
          : record
      )
    )
  }

  // Handle notes change
  const handleNotesChange = (memberId: number, notes: string) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.member_id === memberId
          ? { ...record, notes }
          : record
      )
    )
  }

  // Notify parent component when attendance records change - use debounce to reduce updates
  useEffect(() => {
    // Skip if no callback is provided or records are empty
    if (!onAttendanceChange || !attendanceRecords.length || !isInitialized) return;

    // Use a timeout to debounce updates
    const timer = setTimeout(() => {
      const formattedRecords = attendanceRecords.map(record => ({
        member_id: record.member_id,
        status: record.status,
        notes: record.notes
      }))
      onAttendanceChange(formattedRecords)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [attendanceRecords, onAttendanceChange, isInitialized])

  // Expose functions to parent components via ref
  useImperativeHandle(ref, () => ({
    handleSaveAttendance: async () => {
      return await handleSaveAttendance();
    },
    getAttendanceData: () => {
      // Format data and ensure status values are valid
      return attendanceRecords.map(record => {
        // Validate status to ensure it's one of the expected values from the database schema
        const validStatus = ["Hadir", "Izin", "Alfa"].includes(record.status) ? record.status : "Hadir";

        return {
          member_id: record.member_id,
          status: validStatus,
          notes: record.notes || ""
        };
      });
    }
  }));

  // Handle save all attendance records - store locally without API call
  const handleSaveAttendance = async () => {
    try {
      // Format data and ensure status values are valid
      const attendanceData = attendanceRecords.map(record => {
        // Validate status to ensure it's one of the expected values from the database schema
        const validStatus = ["Hadir", "Izin", "Alfa"].includes(record.status) ? record.status : "Hadir";

        return {
          member_id: record.member_id,
          status: validStatus,
          notes: record.notes || ""
        };
      });

      console.log(`[MemberAttendanceForm] Saving ${attendanceData.length} attendance records for event ${eventId} locally`);

      // Save attendance data to localStorage using our utility function
      const saveResult = saveAttendanceData(eventId, attendanceData);

      if (!saveResult) {
        console.error("[MemberAttendanceForm] Failed to save attendance data");
        toast({
          title: "Error",
          description: "Gagal menyimpan data kehadiran ke penyimpanan lokal",
          variant: "destructive"
        });
        return Promise.reject(new Error("Failed to save attendance data"));
      }

      console.log(`[MemberAttendanceForm] Successfully saved attendance data to localStorage`);

      // Notify parent component about the change
      if (onAttendanceChange && typeof onAttendanceChange === 'function') {
        console.log('[MemberAttendanceForm] Notifying parent component about attendance change');
        onAttendanceChange(attendanceData);
      }

      // Return a resolved promise to indicate success
      return Promise.resolve();
    } catch (error) {
      console.error("[MemberAttendanceForm] Error saving attendance:", error);

      // Return a rejected promise to indicate failure
      return Promise.reject(error);
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "hadir":
        return "success"
      case "izin":
        return "warning"
      case "alfa":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-4">
      {isMembersLoading ? (
        <div className="text-center py-4">
          <p>Memuat data anggota...</p>
        </div>
      ) : (
        <>
          {/* Division tabs for better organization */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="all">Semua</TabsTrigger>
              {divisions.map(division => (
                <TabsTrigger key={division} value={division}>
                  {division}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Table with fixed header and scrollable body */}
            <div className="rounded-md border">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-1/4" />
                  <col className="w-1/4" />
                  <col className="w-1/4" />
                  <col className="w-1/4" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left font-medium">Nama</th>
                    <th className="p-4 text-left font-medium">Divisi</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-left font-medium">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((record) => (
                    <tr key={record.member_id} className="bg-white even:bg-gray-50">
                      <td className="p-4 align-middle">{record.name}</td>
                      <td className="p-4 align-middle">{record.division}</td>
                      <td className="p-4 align-middle">
                        <Select
                          value={record.status}
                          onValueChange={(value) => handleStatusChange(record.member_id, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hadir">Hadir</SelectItem>
                            <SelectItem value="Izin">Izin</SelectItem>
                            <SelectItem value="Alfa">Alfa</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4 align-middle">
                        <Input
                          placeholder="Masukkan keterangan"
                          value={record.notes}
                          onChange={(e) => handleNotesChange(record.member_id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simpan button is now handled by the parent component */}
          </Tabs>
        </>
      )}
    </div>
  )
});
