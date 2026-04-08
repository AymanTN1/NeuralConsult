package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.community.dto.CommunityDetailResponse;
import com.neuralconsult.sevrage.community.dto.CommunityMessageCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityMessageResponse;
import com.neuralconsult.sevrage.community.dto.CommunityServerCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityServerResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/communities")
public class CommunityController {

  private final CommunityService communityService;
  private final UserRepository userRepository;

  public CommunityController(CommunityService communityService, UserRepository userRepository) {
    this.communityService = communityService;
    this.userRepository = userRepository;
  }

  @GetMapping("/servers")
  public List<CommunityServerResponse> listServers(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return communityService.listServers(user);
  }

  @PostMapping("/servers")
  public CommunityServerResponse createServer(@AuthenticationPrincipal UserDetails principal,
                                              @RequestBody CommunityServerCreateRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return communityService.createServer(user, request);
  }

  @PostMapping("/servers/{serverId}/join")
  public CommunityServerResponse join(@AuthenticationPrincipal UserDetails principal,
                                      @PathVariable UUID serverId) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return communityService.join(user, serverId);
  }

  @GetMapping("/servers/{serverId}")
  public CommunityDetailResponse detail(@AuthenticationPrincipal UserDetails principal,
                                        @PathVariable UUID serverId) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return communityService.detail(user, serverId);
  }

  @GetMapping("/channels/{channelId}/messages")
  public List<CommunityMessageResponse> messages(@AuthenticationPrincipal UserDetails principal,
                                                 @PathVariable UUID channelId) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return communityService.listMessages(user, channelId);
  }

  @PostMapping("/channels/{channelId}/messages")
  public CommunityMessageResponse post(@AuthenticationPrincipal UserDetails principal,
                                       @PathVariable UUID channelId,
                                       @RequestBody CommunityMessageCreateRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return communityService.postMessage(user, channelId, request);
  }
}
