"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateSettingsAction } from "@/features/availability/actions";
import {
  type SettingsInput,
  settingsInputSchema,
} from "@/features/availability/schema";
import type { AvailabilitySettingsRow } from "@/features/availability/types";

export function SettingsForm({
  settings,
}: {
  settings: AvailabilitySettingsRow;
}) {
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsInputSchema),
    defaultValues: {
      bufferBeforeMinutes: settings?.bufferBeforeMinutes ?? 0,
      bufferAfterMinutes: settings?.bufferAfterMinutes ?? 0,
      minNoticeHours: settings?.minNoticeHours ?? 0,
      maxAdvanceDays: settings?.maxAdvanceDays ?? null,
    },
  });

  async function onSubmit(values: SettingsInput) {
    try {
      await updateSettingsAction(values);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking guardrails</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bufferBeforeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buffer before (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bufferAfterMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buffer after (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minNoticeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum notice (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxAdvanceDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max advance (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-fit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Save settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
