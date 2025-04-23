"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Mail, MessageCircle } from "lucide-react"

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I create a new event?",
      answer:
        "To create a new event, go to the Dashboard and click on 'Create Event' in the Quick Actions section. Fill in the event details in the form and click 'Create'.",
    },
    {
      question: "How can I manage my team members?",
      answer:
        "You can manage team members by going to the Settings page and selecting the 'Team' tab. Here you can invite new members, manage roles, and remove existing members.",
    },
    {
      question: "How do I generate reports?",
      answer:
        "Navigate to the Reports section from the dashboard. Select the type of report you want to generate, set the date range and other filters, then click 'Generate Report'.",
    },
    {
      question: "Can I customize notification settings?",
      answer:
        "Yes, you can customize your notification preferences in the Settings page under the 'Notifications' tab. You can choose which notifications to receive and how to receive them.",
    },
    {
      question: "How do I update my profile information?",
      answer:
        "Click on your profile picture in the top right corner, select 'Profile', then click 'Edit Profile' to update your information.",
    },
  ]

  return (
    <div className="p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Help Center</h1>
          <p className="text-muted-foreground mt-2">
            Find answers to common questions and learn how to use our platform
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10 max-w-xl" placeholder="Search for help articles..." />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Get in touch with our support team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" />
                Live Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Browse our detailed documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.open("/docs/getting-started", "_blank")}
              >
                Getting Started Guide
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.open("/docs/api", "_blank")}
              >
                API Documentation
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

