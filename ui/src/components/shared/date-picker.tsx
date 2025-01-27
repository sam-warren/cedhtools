"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRESETS = [
  { name: "1 month", value: 30 },
  { name: "3 months", value: 90 },
  { name: "6 months", value: 180 },
  { name: "All time", value: "all" },
  { name: "Post ban", value: "post-ban" },
]

export function DatePickerWithPresets() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(2022, 5, 1), // June 1 2022
    to: new Date(),
  })

  const setPreset = (value: string) => {
    const today = new Date()
    let fromDate: Date

    switch (value) {
      case "post-ban":
        fromDate = new Date(2024, 8, 23) // September 23 2024
        break
      case "all":
        fromDate = new Date(2022, 5, 1) // June 1 2022
        break
      default:
        fromDate = addDays(today, -parseInt(value))
    }

    setDateRange({ from: fromDate, to: today })
  }

  return (
    <div className="flex gap-2">
      <Select onValueChange={(value) => setPreset(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select range..." />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.name} value={preset.value.toString()}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
} 