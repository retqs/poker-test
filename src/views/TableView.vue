<script setup lang="ts">
import { computed, watch } from 'vue'
import { useQuery, useMutation } from '@tanstack/vue-query'
// @ts-expect-error
import { CardGroup, OddsCalculator } from 'poker-tools'

import LoadingIndicator from '../components/LoadingIndicator.vue'
import PokerCard from '../components/PokerCard.vue'
import { getTable, getAssistFromAI } from '../api'

const AI_HELP_FORMAT_KEY = '3blinds-ante'

type StrategyType = Record<string, number>

// move to separate utils folder and type.ts file
function calculateTheHighestValue(strategy: StrategyType): {
  key: string
  value: number
} {
  let highestKey = ''
  let highestValue = -Infinity

  // types is based on API response
  for (const [key, value] of Object.entries(strategy as Record<string, number>)) {
    if (value > highestValue) {
      highestValue = value
      highestKey = key
    }
  }

  return {
    key: highestKey,
    value: highestValue
  }
}

const props = defineProps<{
  id: number
}>()

const currentPageId = computed(() => props.id)

const {
  data: table,
  isPending,
  refetch: refetchTable
} = useQuery({
  queryKey: ['table', currentPageId.value],
  queryFn: () => getTable(currentPageId.value),
  refetchInterval: 2500
})

const { data: AI, mutate: requestAIHelp } = useMutation({
  mutationFn: getAssistFromAI,
  onSuccess: (data) => {
    const highestData = calculateTheHighestValue(data.strategy)

    alert(`Suggested strategy: ${highestData.key}`)
  },
  onError: (error) => {
    console.error(error, 'error.')
    alert('Unable to assist you')
  }
})

watch(currentPageId, () => {
  refetchTable()
})

watch(table, (tableValue) => {
  if (tableValue && tableValue.communityCards.length === 5) {
    console.log('all five, in the end, highlight here cards with styles')
    const board = CardGroup.fromString(tableValue.communityCards.join(''))

    const players = tableValue.holeCards.map((cards) => {
      return CardGroup.fromString(cards?.join(''))
    })

    const result = OddsCalculator.calculateEquity(players, board)
    const resultWinner = OddsCalculator.calculateWinner(players, board)

    console.log(result, 'result??')
    console.log(resultWinner, 'resultWinner')
  }
})

const handleAskAI = () => {
  const players = table.value!.holeCards.map((cards) => cards?.join(''))
  const sumsForPlayers = players.map((_) => '1000').join('|')

  const format = AI_HELP_FORMAT_KEY
  const state = `:${players.join('|')}:${sumsForPlayers}`

  const data: Record<string, string> = {
    format,
    state
  }

  const formData = new FormData()

  for (const name in data) {
    formData.append(name, data[name])
  }

  requestAIHelp(formData)
}
</script>
<template>
  <div class="p-2">
    <LoadingIndicator v-if="isPending" class="ml-auto mr-auto pt-4" />
    <template v-else-if="table">
      <h1 class="text-2xl py-4">{{ table.name }}</h1>
      <div class="grid grid-cols-4 gap-2">
        <template v-for="index in Math.min(4, table.capacity)" :key="index">
          <div
            class="border-solid solid border-2 p-2 rounded-xl flex items-center justify-center gap-2 w-full relative"
            :class="{
              'bg-green-200 border-4 border-black': index === 1
            }"
          >
            <template v-if="index === 1">
              <div class="absolute top-0 right-0 z-10 leading-[0]">
                <button
                  class="bg-blue-500 text-white p-1 text-xs rounded-tr-lg rounded-bl-lg"
                  @click="handleAskAI"
                >
                  Ask AI
                </button>
              </div>
            </template>

            <template v-if="table.holeCards[index - 1]?.length">
              <PokerCard
                v-for="card in table.holeCards[index - 1]"
                :key="card"
                :card="card"
                class="transition-opacity duration-1000"
              />
            </template>
            <template v-else><span class="font-bold text-2xl">Folded</span></template>
          </div>
        </template>
      </div>
      <div
        class="p-8 my-2 bg-green-800 rounded-xl flex gap-2 items-center justify-center text-white"
      >
        <template v-if="table.communityCards.length">
          <PokerCard
            v-for="card in table.communityCards"
            :key="card"
            :card="card"
            class="transition-opacity duration-1000"
          />
        </template>
        <template v-else> No cards on table </template>
      </div>
      <div v-if="table.capacity > 4" class="grid grid-cols-4 gap-2">
        <template v-for="index in table.capacity - 4" :key="index + 4">
          <div
            class="border-solid solid border-2 p-2 rounded-xl flex items-center justify-center gap-2 w-full"
          >
            <template v-if="table.holeCards[index - 1 + 4]?.length">
              <PokerCard
                v-for="card in table.holeCards[index - 1 + 4]"
                :key="card"
                :card="card"
                class="transition-opacity duration-1000"
              />
            </template>
            <template v-else><span class="font-bold text-2xl">Folded</span></template>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
