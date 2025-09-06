import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Speed,
  CheckCircle,
  Memory,
  Refresh,
  AccessTime,
  CloudCircle,
  NetworkCheck,
  BugReport,
  ExpandMore,
  Api,
  Code,
  Timeline,
  DataUsage,
  Computer,
  Dns,
} from '@mui/icons-material';
import { adminService } from '../services/adminService';

// 타입 정의
interface SystemStatus {
  status: string;
  uptime: number;
  modules: {
    session: { status: string };
    document_processor: { status: string };
    retrieval: { status: string };
    generation: { status: string };
  };
  memory_usage: {
    rss: number;
    heap_used: number;
    heap_total: number;
    external: number;
  };
  performance?: {
    avg_response_time: number;
    total_requests: number;
    active_sessions: number;
  };
}

interface ApiCallLog {
  timestamp: string;
  endpoint: string;
  data: unknown;
  error: string | null;
  status: 'success' | 'error';
}

export const StatsTab: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [apiCalls, setApiCalls] = useState<Record<string, ApiCallLog>>({});
  const [error, setError] = useState<string | null>(null);

  // API 호출 로거 
  const logApiCall = useCallback((endpoint: string, data: unknown, error?: Error) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      endpoint,
      data: error ? null : data,
      error: error?.message || null,
      status: error ? 'error' : 'success'
    };
    
    setApiCalls(prev => ({
      ...prev,
      [endpoint]: logEntry
    }));
  }, []);

  const fetchSystemStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 시스템 통계 데이터 로딩 중...');
      
      // 시스템 상태 조회
      const statusData = await adminService.getSystemStatus();
      logApiCall('/api/admin/status', statusData);
      setSystemStatus(statusData);
      
      console.log('✅ 시스템 상태 데이터 로드 완료:', statusData);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      console.error('❌ 통계 데이터 로딩 실패:', err);
      logApiCall('/api/admin/status', null, err instanceof Error ? err : new Error(String(err)));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [logApiCall]);

  useEffect(() => {
    fetchSystemStats();
    
    // 30초마다 자동 갱신
    const interval = setInterval(fetchSystemStats, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemStats]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}시간 ${minutes}분`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'running':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
      {/* 헤더 */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 3,
          color: 'white'
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="600" gutterBottom>
            🔧 시스템 통계
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            실시간 시스템 상태 및 성능 모니터링
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch 
                checked={debugMode} 
                onChange={(e) => setDebugMode(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'white',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <BugReport />
                <Typography variant="body2">디버그 모드</Typography>
              </Box>
            }
            sx={{ color: 'white' }}
          />
          
          <Tooltip title="새로고침">
            <IconButton 
              onClick={fetchSystemStats} 
              disabled={loading}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 에러 알림 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress sx={{ borderRadius: 1 }} />
        </Box>
      )}

      {/* 시스템 상태 카드들 */}
      {systemStatus && (
        <>
          {/* 상태 개요 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'success.light',
                        color: 'success.dark'
                      }}
                    >
                      <CheckCircle fontSize="large" />
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        시스템 상태
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h5" fontWeight="600">
                          {systemStatus.status}
                        </Typography>
                        <Chip 
                          label={systemStatus.status}
                          color={getStatusColor(systemStatus.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(118, 75, 162, 0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'info.light',
                        color: 'info.dark'
                      }}
                    >
                      <AccessTime fontSize="large" />
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        가동시간
                      </Typography>
                      <Typography variant="h5" fontWeight="600">
                        {formatUptime(systemStatus.uptime)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'warning.light',
                        color: 'warning.dark'
                      }}
                    >
                      <Memory fontSize="large" />
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        메모리 사용량
                      </Typography>
                      <Typography variant="h5" fontWeight="600">
                        {formatBytes(systemStatus.memory_usage.rss)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Heap: {formatBytes(systemStatus.memory_usage.heap_used)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: systemStatus.performance ? 'success.light' : 'grey.300',
                        color: systemStatus.performance ? 'success.dark' : 'grey.600'
                      }}
                    >
                      <Speed fontSize="large" />
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        {systemStatus.performance ? '활성 세션' : '성능 데이터'}
                      </Typography>
                      <Typography variant="h5" fontWeight="600">
                        {systemStatus.performance?.active_sessions ?? 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {systemStatus.performance 
                          ? `총 요청: ${systemStatus.performance.total_requests?.toLocaleString() ?? 0}`
                          : '데이터 수집 중...'
                        }
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 모듈 상태 */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 4, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Computer color="primary" />
              모듈 상태
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {Object.entries(systemStatus.modules).map(([module, info]) => (
                <Grid item xs={12} sm={6} md={3} key={module}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {module.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Chip 
                      label={info.status}
                      color={getStatusColor(info.status)}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* 성능 메트릭 */}
          {systemStatus.performance && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 4, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline color="primary" />
                성능 메트릭
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      평균 응답시간
                    </Typography>
                    <Typography variant="h4" color="primary" fontWeight="600">
                      {systemStatus.performance.avg_response_time?.toFixed(0) ?? 0}ms
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      총 요청 수
                    </Typography>
                    <Typography variant="h4" color="success.main" fontWeight="600">
                      {systemStatus.performance.total_requests?.toLocaleString() ?? '0'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      활성 세션
                    </Typography>
                    <Typography variant="h4" color="info.main" fontWeight="600">
                      {systemStatus.performance.active_sessions ?? 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </>
      )}

      {/* 디버그 정보 */}
      <Collapse in={debugMode}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            border: '1px solid',
            borderColor: 'warning.light',
            borderRadius: 3,
            bgcolor: 'warning.50'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReport color="warning" />
            디버그 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Api />
                API 호출 로그
                <Badge badgeContent={Object.keys(apiCalls).length} color="primary" />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {Object.entries(apiCalls).map(([endpoint, log]) => (
                  <ListItem key={endpoint}>
                    <ListItemIcon>
                      <Chip 
                        label={log.status}
                        color={log.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={endpoint}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            시간: {new Date(log.timestamp).toLocaleTimeString()}
                          </Typography>
                          {log.error && (
                            <Typography variant="caption" color="error" display="block">
                              오류: {log.error}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Code />
                시스템 로그
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  maxHeight: 300,
                  overflow: 'auto'
                }}
              >
                {systemStatus && (
                  <pre>
                    {JSON.stringify(systemStatus, null, 2)}
                  </pre>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NetworkCheck />
                연결 정보
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                <ListItem>
                  <ListItemIcon><Dns /></ListItemIcon>
                  <ListItemText
                    primary="API Base URL"
                    secondary="https://simple-rag-production-bb72.up.railway.app"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><DataUsage /></ListItemIcon>
                  <ListItemText
                    primary="WebSocket URL"
                    secondary="wss://simple-rag-production-bb72.up.railway.app"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CloudCircle /></ListItemIcon>
                  <ListItemText
                    primary="환경"
                    secondary={import.meta.env.DEV ? 'Development' : 'Production'}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Collapse>
    </Box>
  );
};