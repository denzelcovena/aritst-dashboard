import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hdpqlexoikjatryivwlm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcHFsZXhvaWtqYXRyeWl2d2xtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMTk4NDcsImV4cCI6MjA5ODU5NTg0N30.gxNaW9jK-ucYIMXTjNyT98b233JH2IvazVBFjcJ0Sqk'

export const supabase = createClient(supabaseUrl, supabaseKey)
