import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const CSV_HEADERS = [
  'SNK ID', 'Full Name', 'Mobile Number', 'Gender', 'Age', 
  'Address', 'Model/Division', 'Branch', 'Accommodation', 'Duty/Designation', 'Status', 'Registered Date'
];
// oxlint-disable-next-line react-doctor/nextjs-no-side-effect-in-get-handler -- CSV download is triggered via GET link and may refresh session cookies
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const user = authData.user
    const role = user.user_metadata?.role

    if (role !== 'SUPER_ADMIN' && role !== 'MODEL_HEAD') {
      return new NextResponse('Forbidden: Insufficient permissions', { status: 403 })
    }

    // Parse URL parameters for filters
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'all'
    const modelFilter = searchParams.get('model') || 'all'
    const rawSearch = searchParams.get('search') || ''
    // Sanitize search string for PostgREST query to prevent filter injection
    const querySearch = rawSearch.replace(/[%_,()]/g, '')

    // Build Query
    let query = supabase
      .from('volunteers')
      .select(`
        snk_id,
        full_name,
        mobile_number,
        gender,
        age,
        address,
        models:model_id (name),
        branch,
        accommodation,
        designation,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (querySearch) {
      query = query.or(`full_name.ilike.%${querySearch}%,mobile_number.ilike.%${querySearch}%,snk_id.ilike.%${querySearch}%`)
    }

    if (role === 'MODEL_HEAD') {
      // Model Head can only export volunteers under their supervised models
      const { data: myModels } = await supabase.from('models').select('id').eq('head_id', user.id)
      if (!myModels || myModels.length === 0) {
        return new NextResponse('No assigned models.', { status: 403 })
      }
      query = query.in('model_id', myModels.map(m => m.id))
      
      // If they selected a specific model filter within their scope
      if (modelFilter !== 'all') {
        const hasAccess = myModels.some(m => m.id === modelFilter)
        if (hasAccess) {
          query = query.eq('model_id', modelFilter)
        } else {
          return new NextResponse('Unauthorized model selection.', { status: 403 })
        }
      }
    } else if (role === 'SUPER_ADMIN') {
      if (modelFilter !== 'all') {
        query = query.eq('model_id', modelFilter)
      }
    } else {
      return new NextResponse('Insufficient permissions', { status: 403 })
    }

    const { data, error } = await query

    if (error) throw error

    if (!data || data.length === 0) {
      return new NextResponse('No data available to export.', { status: 404 })
    }

    // Build CSV
    
    
    const rows = data.map(v => {
      const modelObj = Array.isArray(v.models) ? v.models[0] : v.models
      const modelName = (modelObj as any)?.name || 'Unassigned'
      const dateStr = new Date(v.created_at).toLocaleDateString('en-IN')
      
      return [
        `"${v.snk_id || ''}"`,
        `"${(v.full_name || '').replace(/"/g, '""')}"`,
        `"${v.mobile_number || ''}"`,
        `"${v.gender || ''}"`,
        `"${v.age || ''}"`,
        `"${(v.address || '').replace(/"/g, '""')}"`,
        `"${modelName}"`,
        `"${(v.branch || '').replace(/"/g, '""')}"`,
        `"${v.accommodation ? 'Yes' : 'No'}"`,
        `"${(v.designation || '').replace(/"/g, '""')}"`,
        `"${v.status || ''}"`,
        `"${dateStr}"`
      ].join(',')
    })

    const csvContent = [CSV_HEADERS.join(','), ...rows].join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="volunteers_export_${Date.now()}.csv"`
      }
    })

  } catch (err: any) {
    console.error('Export error:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
