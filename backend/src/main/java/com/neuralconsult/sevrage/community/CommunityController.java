package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.community.dto.CommunityCommentCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityCommentResponse;
import com.neuralconsult.sevrage.community.dto.CommunityConnectionResponse;
import com.neuralconsult.sevrage.community.dto.CommunityDetailResponse;
import com.neuralconsult.sevrage.community.dto.CommunityDirectMessageRequest;
import com.neuralconsult.sevrage.community.dto.CommunityDirectMessageResponse;
import com.neuralconsult.sevrage.community.dto.CommunityMessageCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityMessageResponse;
import com.neuralconsult.sevrage.community.dto.CommunityProfileRequest;
import com.neuralconsult.sevrage.community.dto.CommunityProfileResponse;
import com.neuralconsult.sevrage.community.dto.CommunityPostCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityPostResponse;
import com.neuralconsult.sevrage.community.dto.CommunityReactionRequest;
import com.neuralconsult.sevrage.community.dto.CommunityShareRequest;
import com.neuralconsult.sevrage.community.dto.CommunityServerCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityServerResponse;
import com.neuralconsult.sevrage.community.dto.CommunitySocialOverviewResponse;
import com.neuralconsult.sevrage.community.dto.CommunityUserProfileResponse;
import com.neuralconsult.sevrage.community.dto.CommunityUserSummaryResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

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
    User user = currentUser(principal);
    return communityService.listServers(user);
  }

  @PostMapping("/servers")
  public CommunityServerResponse createServer(@AuthenticationPrincipal UserDetails principal,
                                              @RequestBody CommunityServerCreateRequest request) {
    User user = currentUser(principal);
    return communityService.createServer(user, request);
  }

  @PostMapping("/servers/{serverId}/join")
  public CommunityServerResponse join(@AuthenticationPrincipal UserDetails principal,
                                      @PathVariable UUID serverId) {
    User user = currentUser(principal);
    return communityService.join(user, serverId);
  }

  @GetMapping("/servers/{serverId}")
  public CommunityDetailResponse detail(@AuthenticationPrincipal UserDetails principal,
                                        @PathVariable UUID serverId) {
    User user = currentUser(principal);
    return communityService.detail(user, serverId);
  }

  @GetMapping("/channels/{channelId}/messages")
  public List<CommunityMessageResponse> messages(@AuthenticationPrincipal UserDetails principal,
                                                 @PathVariable UUID channelId) {
    User user = currentUser(principal);
    return communityService.listMessages(user, channelId);
  }

  @PostMapping("/channels/{channelId}/messages")
  public CommunityMessageResponse post(@AuthenticationPrincipal UserDetails principal,
                                       @PathVariable UUID channelId,
                                       @RequestBody CommunityMessageCreateRequest request) {
    User user = currentUser(principal);
    return communityService.postMessage(user, channelId, request);
  }

  @GetMapping("/social")
  public CommunitySocialOverviewResponse social(@AuthenticationPrincipal UserDetails principal) {
    return communityService.socialOverview(currentUser(principal));
  }

  @GetMapping("/social/profile")
  public CommunityProfileResponse myProfile(@AuthenticationPrincipal UserDetails principal) {
    return communityService.myProfile(currentUser(principal));
  }

  @PutMapping("/social/profile")
  public CommunityProfileResponse updateProfile(@AuthenticationPrincipal UserDetails principal,
                                                @RequestBody CommunityProfileRequest request) {
    return communityService.updateMyProfile(currentUser(principal), request);
  }

  @GetMapping("/social/search")
  public List<CommunityUserSummaryResponse> search(@AuthenticationPrincipal UserDetails principal,
                                                   @RequestParam(name = "query", required = false) String query) {
    return communityService.searchUsers(currentUser(principal), query);
  }

  @GetMapping("/social/users/{targetUserId}")
  public CommunityUserProfileResponse profile(@AuthenticationPrincipal UserDetails principal,
                                              @PathVariable UUID targetUserId) {
    return communityService.userProfile(currentUser(principal), targetUserId);
  }

  @GetMapping("/social/users/by-username/{username}")
  public CommunityUserProfileResponse profileByUsername(@AuthenticationPrincipal UserDetails principal,
                                                        @PathVariable String username) {
    return communityService.userProfileByUsername(currentUser(principal), username);
  }

  @PostMapping("/social/posts")
  public CommunityPostResponse createPost(@AuthenticationPrincipal UserDetails principal,
                                          @RequestBody CommunityPostCreateRequest request) {
    return communityService.createPost(currentUser(principal), request);
  }

  @PostMapping("/social/bot/posts")
  public CommunityPostResponse createBotPost(@RequestBody CommunityPostCreateRequest request,
                                             @RequestParam(name = "secret") String secret) {
    if (!"NeuralBotSecret2025".equals(secret)) {
      throw new IllegalArgumentException("Unauthorized bot call");
    }
    User bot = userRepository.findByCommunityUsernameIgnoreCase("neuralconsult.sevrage")
        .orElseThrow(() -> new IllegalStateException("Bot user not found"));
    return communityService.createPost(bot, request);
  }

  @DeleteMapping("/social/posts/{postId}")
  public org.springframework.http.ResponseEntity<Void> deletePost(@AuthenticationPrincipal UserDetails principal,
                                                                 @PathVariable UUID postId) {
    communityService.deletePost(currentUser(principal), postId);
    return org.springframework.http.ResponseEntity.noContent().build();
  }

  @PostMapping("/social/posts/{postId}/reactions")
  public CommunityPostResponse react(@AuthenticationPrincipal UserDetails principal,
                                     @PathVariable UUID postId,
                                     @RequestBody CommunityReactionRequest request) {
    return communityService.reactToPost(currentUser(principal), postId, request);
  }

  @PostMapping("/social/comments/{commentId}/reactions")
  public CommunityCommentResponse reactComment(@AuthenticationPrincipal UserDetails principal,
                                               @PathVariable UUID commentId,
                                               @RequestBody CommunityReactionRequest request) {
    return communityService.reactToComment(currentUser(principal), commentId, request);
  }

  @PostMapping("/social/posts/{postId}/comments")
  public CommunityPostResponse comment(@AuthenticationPrincipal UserDetails principal,
                                       @PathVariable UUID postId,
                                       @RequestBody CommunityCommentCreateRequest request) {
    return communityService.commentOnPost(currentUser(principal), postId, request);
  }

  @PostMapping("/social/posts/{postId}/share")
  public CommunityDirectMessageResponse share(@AuthenticationPrincipal UserDetails principal,
                                              @PathVariable UUID postId,
                                              @RequestBody CommunityShareRequest request) {
    return communityService.sharePost(currentUser(principal), postId, request);
  }

  @PostMapping("/social/users/{targetUserId}/follow")
  public CommunityUserSummaryResponse follow(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable UUID targetUserId) {
    return communityService.toggleFollow(currentUser(principal), targetUserId);
  }

  @PostMapping("/social/users/{targetUserId}/connections")
  public CommunityConnectionResponse connect(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable UUID targetUserId) {
    return communityService.sendConnectionRequest(currentUser(principal), targetUserId);
  }

  @PostMapping("/social/connections/{connectionId}/accept")
  public CommunityConnectionResponse acceptConnection(@AuthenticationPrincipal UserDetails principal,
                                                      @PathVariable UUID connectionId) {
    return communityService.acceptConnection(currentUser(principal), connectionId);
  }

  @PostMapping("/social/connections/{connectionId}/decline")
  public CommunityConnectionResponse declineConnection(@AuthenticationPrincipal UserDetails principal,
                                                       @PathVariable UUID connectionId) {
    return communityService.declineConnection(currentUser(principal), connectionId);
  }

  @GetMapping("/social/direct/{counterpartId}")
  public List<CommunityDirectMessageResponse> directThread(@AuthenticationPrincipal UserDetails principal,
                                                           @PathVariable UUID counterpartId) {
    return communityService.directThread(currentUser(principal), counterpartId);
  }

  @PostMapping("/social/direct/{counterpartId}")
  public CommunityDirectMessageResponse sendDirectMessage(@AuthenticationPrincipal UserDetails principal,
                                                          @PathVariable UUID counterpartId,
                                                          @RequestBody CommunityDirectMessageRequest request) {
    return communityService.sendDirectMessage(currentUser(principal), counterpartId, request);
  }

  private User currentUser(UserDetails principal) {
    return userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
  }
}
