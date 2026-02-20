import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
    const rewards = [
        { title: 'A relaxing 30-min massage 💆‍♀️', description: 'Perfect after a long day of work or studying.', point_cost: 150, is_active: true },
        { title: 'Movie Night Choice 🍿', description: 'You get full control over the movie and snacks tonight.', point_cost: 200, is_active: true },
        { title: 'Get out of 1 Chore 🧹', description: 'Cash this in to skip one household chore or task, no questions asked.', point_cost: 100, is_active: true },
        { title: 'Cook my favorite meal 🍝', description: 'I will cook your favorite dinner for you.', point_cost: 300, is_active: true },
        { title: 'Surprise Date Night 🌹', description: 'I will plan and pay for a complete surprise date night.', point_cost: 500, is_active: true },
        { title: 'Breakfast in Bed 🥞', description: 'Wake up to a delicious, hot breakfast served in bed.', point_cost: 250, is_active: true },
        { title: 'Win an argument 🏆', description: 'Instantly win any minor disagreement (use wisely!).', point_cost: 1000, is_active: true }
    ]

    const { error } = await supabase.from('rewards').insert(rewards)
    if (error) {
        console.error('Error seeding rewards:', error)
    } else {
        console.log('Successfully seeded rewards!')
    }
}

seed()
