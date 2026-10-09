export const formatDate=(value?:string|null)=>value?new Date(value.length===10?`${value}T12:00`:value).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'No date set'
