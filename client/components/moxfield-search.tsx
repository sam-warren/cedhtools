"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function MoxfieldSearch() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const router = useRouter()

  const handleSubmit = (moxfieldUrl: string) => {
    // Extract the Moxfield deck ID from the URL
    const deckIdMatch = moxfieldUrl.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/)
    if (deckIdMatch) {
      const deckId = deckIdMatch[1]
      router.push(`/deck/${deckId}`)
    } else {
      // If it's not a URL but might be a direct ID
      if (moxfieldUrl && moxfieldUrl.trim()) {
        router.push(`/deck/${moxfieldUrl.trim()}`)
      }
    }
    setOpen(false)
  }

  return (
    <>
      <div className="w-full">
        <button
          onClick={() => setOpen(true)}
          className="w-full inline-flex items-center justify-between rounded-md border border-input bg-background px-4 py-3 text-sm shadow-md ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <SearchIcon className="h-4 w-4 shrink-0 opacity-50" />
            <span className="text-muted-foreground">Search Moxfield decks...</span>
          </div>
        </button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput 
            placeholder="Enter Moxfield deck URL or ID..."
            value={value}
            onValueChange={setValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit(value)
              }
            }}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Example">
              <CommandItem onSelect={() => handleSubmit(value)}>
                <SearchIcon className="mr-2 h-4 w-4" />
                <span>Search for {value || "a deck"}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
} 