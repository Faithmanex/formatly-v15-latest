'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Users, FileText, Activity, Key, Settings, AlertTriangle, CheckCircle, Clock, Copy, Trash2, RefreshCw } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

// Mock data
const systemStats = {
  totalUsers: 1247,
  activeUsers: 892,
  totalDocuments: 15634,
  documentsToday: 234,
  avgProcessingTime: 45,
  systemHealth: 98.5,
  storageUsed: 67
}

const recentLogs = [
  {
    id: 1,
    timestamp: "2024-01-15 14:30:22",
    level: "INFO",
    message: "Document processed successfully",
    userId: "user_123",
    documentId: "doc_456"
  },
  {
    id: 2,
    timestamp: "2024-01-15 14:29:15",
    level: "ERROR",
    message: "Processing failed: Invalid file format",
    userId: "user_789",
    documentId: "doc_101"
  },
  {
    id: 3,
    timestamp: "2024-01-15 14:28:03",
    level: "WARN",
    message: "High processing queue detected",
    userId: null,
    documentId: null
  }
]

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    documentsUsed: 45,
    quota: 100,
    lastActive: "2024-01-15",
    status: "active"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    documentsUsed: 12,
    quota: 100,
    lastActive: "2024-01-14",
    status: "active"
  },
  {
    id: 3,
    name: "Guest User",
    email: "guest@temp.com",
    role: "guest",
    documentsUsed: 1,
    quota: 1,
    lastActive: "2024-01-15",
    status: "active"
  }
]

const apiKeys = [
  {
    id: 1,
    name: "Production API",
    key: "sk-formatly-prod-...",
    created: "2024-01-10",
    lastUsed: "2024-01-15",
    status: "active"
  },
  {
    id: 2,
    name: "Development API",
    key: "sk-formatly-dev-...",
    created: "2024-01-12",
    lastUsed: "2024-01-14",
    status: "active"
  }
]

export function AdminPanel() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState("")
  const { toast } = useToast()

  const handleToggleMaintenance = () => {
    setMaintenanceMode(!maintenanceMode)
    toast({
      title: maintenanceMode ? "Maintenance Mode Disabled" : "Maintenance Mode Enabled",
      description: maintenanceMode 
        ? "System is now available to users" 
        : "System is now in maintenance mode",
    })
  }

  const handleCreateApiKey = () => {
    if (!newApiKeyName.trim()) return
    
    toast({
      title: "API Key Created",
      description: `New API key "${newApiKeyName}" has been generated`,
    })
    setNewApiKeyName("")
  }

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800'
      case 'INFO':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            System administration and monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="maintenance">Maintenance Mode</Label>
          <Switch
            id="maintenance"
            checked={maintenanceMode}
            onCheckedChange={handleToggleMaintenance}
          />
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.activeUsers} active today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalDocuments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.documentsToday} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.avgProcessingTime}s</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.systemHealth}%</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Server</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processing Queue</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    12 pending
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage</span>
                  <div className="flex items-center gap-2">
                    <Progress value={systemStats.storageUsed} className="w-20 h-2" />
                    <span className="text-xs">{systemStats.storageUsed}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <Badge className={getLevelColor(log.level)} variant="secondary">
                        {log.level}
                      </Badge>
                      <div className="flex-1">
                        <p>{log.message}</p>
                        <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage user accounts and quotas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(user.documentsUsed / user.quota) * 100} 
                            className="w-16 h-2" 
                          />
                          <span className="text-xs">
                            {user.documentsUsed}/{user.quota}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.lastActive}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                Real-time system logs and error monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg text-sm">
                      <Badge className={getLevelColor(log.level)} variant="secondary">
                        {log.level}
                      </Badge>
                      <div className="flex-1">
                        <p>{log.message}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>{log.timestamp}</span>
                          {log.userId && <span>User: {log.userId}</span>}
                          {log.documentId && <span>Doc: {log.documentId}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
              <CardDescription>
                Create and manage API keys for external access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="API key name"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                />
                <Button onClick={handleCreateApiKey}>
                  Create Key
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell className="font-mono text-sm">{key.key}</TableCell>
                      <TableCell>{key.created}</TableCell>
                      <TableCell>{key.lastUsed}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(key.status)}>
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopyApiKey(key.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Maintenance Tools
              </CardTitle>
              <CardDescription>
                System maintenance and administrative tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <RefreshCw className="h-6 w-6 mb-2" />
                  Clear Cache
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  System Restart
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Maintenance Mode
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  When enabled, the system will show a maintenance page to users and prevent new document processing.
                </p>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={handleToggleMaintenance}
                  />
                  <Label>
                    {maintenanceMode ? 'Maintenance mode is ON' : 'Maintenance mode is OFF'}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
