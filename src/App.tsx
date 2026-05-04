import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SDK</h1>
          <p className="text-muted-foreground mt-1">
            shadcn/ui components preview
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Enter your email" />
            </div>
            <Button className="w-full">Submit</Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent
            value="tab1"
            className="p-4 text-sm text-muted-foreground"
          >
            Content for tab 1
          </TabsContent>
          <TabsContent
            value="tab2"
            className="p-4 text-sm text-muted-foreground"
          >
            Content for tab 2
          </TabsContent>
          <TabsContent
            value="tab3"
            className="p-4 text-sm text-muted-foreground"
          >
            Content for tab 3
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
