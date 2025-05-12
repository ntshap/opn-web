import { Member } from "@/lib/api-service" // Updated path
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
// Badge styling is now handled via CSS classes
import { Edit, Trash } from "lucide-react"
import { ProtectedImage } from "@/components/shared/ProtectedImage"

interface MemberCardProps {
  member: Member
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
}

export function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  // Get initials from full name
  const getInitials = (name: string | undefined) => {
    if (!name) return 'NA';

    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0 flex flex-col items-center">
        <Avatar className="h-20 w-20 mb-2">
          {member.photo_url && member.photo_url !== 'string' ||
           (member.member_info && member.member_info.photo_url && member.member_info.photo_url !== 'string') ? (
            <ProtectedImage
              filePath={
                (member.photo_url && member.photo_url !== 'string' ? member.photo_url : '') ||
                (member.member_info && member.member_info.photo_url && member.member_info.photo_url !== 'string' ? member.member_info.photo_url : '') ||
                ''
              }
              alt={`Photo of ${member.full_name && member.full_name !== 'string' ? member.full_name : 'member'}`}
              className="h-full w-full object-cover"
              fallbackSrc="/default-avatar.png"
              loadingComponent={
                <div className="flex items-center justify-center h-full w-full bg-muted">
                  <div className="animate-pulse h-full w-full bg-muted-foreground/20"></div>
                </div>
              }
            />
          ) : (
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {getInitials(member.full_name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="text-center">
          <h3 className="font-medium text-lg">{member.full_name === 'string' ? 'Nama Anggota' : member.full_name}</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 text-center">
        <div className="flex flex-col items-center gap-2">
          <button
            className="py-1 px-3 rounded"
            style={{
              backgroundColor: "#f3f4f6",
              border: "none",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              color: "#4b5563",
              fontWeight: 400
            }}
          >
            {member.division === 'string' ? 'Tidak ada divisi' :
             member.division === 'divisi agama' ? 'Divisi Agama' :
             member.division === 'divisi sosial' ? 'Divisi Sosial' :
             member.division === 'divisi lingkungan' ? 'Divisi Lingkungan' :
             member.division === 'divisi perlengkapan' ? 'Divisi Perlengkapan' :
             member.division === 'divisi media' ? 'Divisi Media' :
             (member.division || 'Tidak ada divisi')}
          </button>

          {member.age && member.age > 0 && (
            <span className="text-sm text-gray-500">
              Usia: {member.age} tahun
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          size="sm"
          onClick={() => onDelete(member)}
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            border: "none",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            fontWeight: 400
          }}
        >
          <Trash className="h-4 w-4 mr-2" />
          Hapus
        </Button>
      </CardFooter>
    </Card>
  )
}
