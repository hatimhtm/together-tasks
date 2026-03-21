const fs = require('fs');
const file = 'src/app/(dashboard)/weekly-review/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const search = `            const allTasks = weekTasks || []
            const myCompleted = allTasks.filter((t: any) => t.assignee_id === user.id && t.is_completed).length
            const partnerCompleted = allTasks.filter((t: any) => myProfile?.partner_id && t.assignee_id === myProfile.partner_id && t.is_completed).length

            // Best day
            const dayMap: Record<string, number> = {}
            allTasks.filter((t: any) => t.assignee_id === user.id && t.is_completed && t.completed_at).forEach((t: any) => {
                const d = format(new Date(t.completed_at), 'EEE')
                dayMap[d] = (dayMap[d] || 0) + 1
            })
            const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]`;

const replace = `            const allTasks = weekTasks || []
            let myCompleted = 0
            let partnerCompleted = 0
            const dayMap: Record<string, number> = {}
            const partnerId = myProfile?.partner_id
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

            for (let i = 0; i < allTasks.length; i++) {
                const t = allTasks[i]
                if (t.is_completed) {
                    if (t.assignee_id === user.id) {
                        myCompleted++
                        if (t.completed_at) {
                            const d = days[new Date(t.completed_at).getDay()]
                            dayMap[d] = (dayMap[d] || 0) + 1
                        }
                    } else if (partnerId && t.assignee_id === partnerId) {
                        partnerCompleted++
                    }
                }
            }

            let bestDay: [string, number] | undefined
            let maxCount = 0
            for (const d in dayMap) {
                if (dayMap[d] > maxCount) {
                    maxCount = dayMap[d]
                    bestDay = [d, maxCount]
                }
            }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log("File patched successfully!");
} else {
    console.log("Could not find the search string in the file.");
}
