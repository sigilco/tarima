import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";

export default {
  Default: () => (
    <Tabs defaultValue="brief" className="w-96">
      <TabsList>
        <TabsTrigger value="brief">Brief</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
        <TabsTrigger value="room">Room</TabsTrigger>
      </TabsList>
      <TabsContent value="brief">Brief panel.</TabsContent>
      <TabsContent value="table">Table panel.</TabsContent>
      <TabsContent value="room">Room panel.</TabsContent>
    </Tabs>
  ),
};
