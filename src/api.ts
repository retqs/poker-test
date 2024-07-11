import { z } from 'zod'

const tableSchema = z.object({
  id: z.number(),
  name: z.string(),
  capacity: z.number(),
  holeCards: z.array(z.union([z.array(z.string()), z.null()])),
  communityCards: z.array(z.string())
})

const tableInfoSchema = tableSchema.pick({
  id: true,
  name: true
})
type Table = z.infer<typeof tableSchema>
type TableInfo = z.infer<typeof tableInfoSchema>

export function getTables(): Promise<TableInfo[]> {
  return fetch('/api/tables')
    .then((r) => r.json())
    .then((data) => z.array(tableInfoSchema).parse(data))
}

export function getTable(id: number): Promise<Table> {
  return fetch(`/api/tables/${id}`)
    .then((r) => r.json())
    .then((data) => tableSchema.parse(data))
}

export function createTable(input: Omit<Table, 'id'>): Promise<Table> {
  return fetch('/api/tables', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  })
    .then((r) => r.json())
    .then((data) => tableSchema.parse(data))
}

export function getAssistFromAI(requestBody: any): Promise<any> {
  return fetch('https://rlbot-svc.prod.kashxa-infra.com/act', {
    headers: {
      Authorization: 'dc929e5e5e6d83784baa294a1819dfe1'
    },
    method: 'POST',
    body: requestBody
    // since it's 3rd API didn't added zod validation
  }).then((r) => r.json())
}
